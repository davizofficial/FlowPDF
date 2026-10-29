import { PDFDocument } from 'pdf-lib';
import type {
  OutputArtifact,
  ProcessingAdapter,
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
} from '../shared-types';
import { calculateCompressionReport, sanitizeFilename } from '../../lib/format';
import { verifyOutputArtifact } from '../output';
import { renderPdfPageToImage } from './pdfjs-helper';
import { en } from '../../i18n/en';

export type CompressionProfile =
  | 'high-quality'
  | 'balanced'
  | 'smallest-file'
  | 'no-recompression';

export interface CompressPdfOptions {
  profile?: CompressionProfile;
  outputFilename?: string;
}

export class CompressPdfAdapter implements ProcessingAdapter<CompressPdfOptions> {
  readonly toolId = 'compress-pdf' as const;

  async validate(input: ProcessingInput<CompressPdfOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
  }

  async run(
    input: ProcessingInput<CompressPdfOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    const file = input.files[0];
    const baselineBytes = new Uint8Array(await file.arrayBuffer());
    const profile: CompressionProfile = input.options.profile ?? 'high-quality';
    const warnings: string[] = [];

    onProgress({
      stage: 'Reading files',
      message: `Analyzing ${file.name} (${baselineBytes.byteLength} bytes)...`,
    });

    const srcDoc = await PDFDocument.load(baselineBytes, { updateMetadata: false });
    const pageCount = srcDoc.getPageCount();

    const outputName = sanitizeFilename(
      input.options.outputFilename ||
        `${file.name.replace(/\.pdf$/i, '')}-compressed`,
      '.pdf'
    );

    if (profile === 'no-recompression') {
      const cloned = new Uint8Array(baselineBytes.byteLength);
      cloned.set(baselineBytes);
      const artifact: OutputArtifact = {
        name: outputName,
        mimeType: 'application/pdf',
        bytes: cloned,
        pageCount,
      };
      const report = {
        inputBytes: baselineBytes.byteLength,
        outputBytes: cloned.byteLength,
        savedBytes: 0,
        savingsPercent: 0,
        retainedBaseline: true,
        profileUsed: profile,
        reason: 'No re-compression profile selected; original baseline retained.',
      };
      return {
        outputs: [artifact],
        warnings: ['No re-compression pass was requested. Baseline document preserved.'],
        metadata: {
          totalOutputPages: pageCount,
          inputBytesTotal: baselineBytes.byteLength,
          outputBytesTotal: cloned.byteLength,
          compressionReport: report,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    onProgress({
      stage: 'Processing document',
      completed: 0,
      total: pageCount,
      message: `Running ${profile} optimization pass...`,
    });

    // Pass 1: Lossless structural & object-stream compaction
    const compactDoc = await PDFDocument.create();
    const copiedPages = await compactDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((p) => compactDoc.addPage(p));
    compactDoc.setTitle('');
    compactDoc.setProducer('');
    compactDoc.setCreator('');

    let candidateBytes = await compactDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });
    let usedRasterPass = false;

    // Pass 2: For 'balanced' or 'smallest-file', attempt controlled JPEG page re-encoding
    // when running in a browser environment with working 2D canvas support.
    if (profile === 'balanced' || profile === 'smallest-file') {
      try {
        const scale = profile === 'balanced' ? 1.2 : 0.95;
        const quality = profile === 'balanced' ? 0.68 : 0.48;
        const rasterDoc = await PDFDocument.create();
        let rasterSucceeded = true;

        for (let p = 1; p <= pageCount; p++) {
          if (input.signal?.aborted) throw new Error(en.errors.cancelled);
          onProgress({
            stage: 'Processing document',
            completed: p - 1,
            total: pageCount,
            message: `Optimizing page ${p} of ${pageCount}...`,
          });

          const origPage = srcDoc.getPage(p - 1);
          const { width, height } = origPage.getSize();
          const rendered = await renderPdfPageToImage(baselineBytes, p, {
            scale,
            format: 'image/jpeg',
            quality,
          });

          if (!rendered.bytes || rendered.bytes.byteLength === 0) {
            rasterSucceeded = false;
            break;
          }

          const jpgImage = await rasterDoc.embedJpg(rendered.bytes);
          const newPage = rasterDoc.addPage([width, height]);
          newPage.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }

        if (rasterSucceeded && rasterDoc.getPageCount() === pageCount) {
          const rasterBytes = await rasterDoc.save({ useObjectStreams: true });
          if (rasterBytes.byteLength < candidateBytes.byteLength) {
            candidateBytes = rasterBytes;
            usedRasterPass = true;
          }
        }
      } catch {
        // Fallback cleanly to lossless structural candidate if canvas rendering is unavailable
      }
    }

    onProgress({
      stage: 'Checking output integrity',
      message: 'Validating candidate output and comparing byte size...',
    });

    const candidateArtifact: OutputArtifact = {
      name: outputName,
      mimeType: 'application/pdf',
      bytes: candidateBytes,
      pageCount,
    };

    const candidateCheck = await verifyOutputArtifact(candidateArtifact);
    const report = calculateCompressionReport(
      baselineBytes.byteLength,
      candidateBytes.byteLength,
      profile,
      candidateCheck.valid
    );

    let finalBytes = candidateBytes;
    if (report.retainedBaseline) {
      finalBytes = new Uint8Array(baselineBytes.byteLength);
      finalBytes.set(baselineBytes);
      if (report.reason) {
        warnings.push(report.reason);
      }
    } else {
      warnings.push(en.warnings.compressionLossy);
      if (usedRasterPass) {
        warnings.push(
          'Pages were re-encoded as compressed JPEG streams to reduce size. Selectable text on rasterized pages is flattened.'
        );
      }
    }

    const finalArtifact: OutputArtifact = {
      name: outputName,
      mimeType: 'application/pdf',
      bytes: finalBytes,
      pageCount,
    };

    onProgress({
      stage: 'Preparing download',
      message: 'Compression evaluation complete.',
    });

    return {
      outputs: [finalArtifact],
      warnings,
      metadata: {
        totalOutputPages: pageCount,
        inputBytesTotal: baselineBytes.byteLength,
        outputBytesTotal: finalBytes.byteLength,
        compressionReport: report,
        durationMs: Math.round(performance.now() - startTime),
      },
    };
  }
}
