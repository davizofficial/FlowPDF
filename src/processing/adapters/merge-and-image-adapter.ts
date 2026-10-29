import { PDFDocument, rgb } from 'pdf-lib';
import type {
  OutputArtifact,
  ProcessingAdapter,
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
  ToolId,
} from '../shared-types';
import { sanitizeFilename } from '../../lib/format';
import { verifyOutputArtifact } from '../output';
import { en } from '../../i18n/en';

export type PageSizePreset = 'original' | 'A4' | 'Letter';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';

export interface MergeAndImageOptions {
  outputFilename?: string;
  pageSize?: PageSizePreset;
  orientation?: PageOrientation;
  marginMm?: number;
  backgroundColor?: '#FFFFFF' | '#F5F4F0';
  normalizePdfPages?: boolean;
}

const MM_TO_PT = 72 / 25.4;

const PAGE_DIMENSIONS_PT: Record<'A4' | 'Letter', { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
};

function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 1, g: 1, b: 1 };
  const num = parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export class MergeAndImageAdapter implements ProcessingAdapter<MergeAndImageOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId = 'merge-pdf') {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<MergeAndImageOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
    if (this.toolId === 'merge-pdf' && input.files.length < 2) {
      throw new Error(en.errors.mergeMinItems);
    }
  }

  async run(
    input: ProcessingInput<MergeAndImageOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    onProgress({
      stage: 'Reading files',
      completed: 0,
      total: input.files.length,
      message: `Reading ${input.files.length} input file(s)...`,
    });

    const outPdf = await PDFDocument.create();
    const warnings: string[] = [];
    let inputBytesTotal = 0;

    const pageSizePreset: PageSizePreset =
      input.options.pageSize ?? (this.toolId === 'merge-pdf' ? 'original' : 'A4');
    const orientation: PageOrientation = input.options.orientation ?? 'auto';
    const marginMm = Math.max(0, Math.min(50, input.options.marginMm ?? 10));
    const marginPt = marginMm * MM_TO_PT;
    const bgHex = input.options.backgroundColor ?? '#FFFFFF';
    const bgColor = parseHexRgb(bgHex);

    for (let i = 0; i < input.files.length; i++) {
      if (input.signal?.aborted) {
        throw new Error(en.errors.cancelled);
      }

      const file = input.files[i];
      inputBytesTotal += file.size;

      onProgress({
        stage: 'Preparing pages',
        completed: i,
        total: input.files.length,
        message: `Processing ${file.name} (${i + 1} of ${input.files.length})`,
      });

      const bytes = new Uint8Array(await file.arrayBuffer());
      const lower = file.name.toLowerCase();
      const isPdf = lower.endsWith('.pdf') || file.type === 'application/pdf';
      const isJpg =
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        file.type === 'image/jpeg';
      const isPng = lower.endsWith('.png') || file.type === 'image/png';

      if (isPdf) {
        const srcPdf = await PDFDocument.load(bytes, { updateMetadata: false });
        const indices = srcPdf.getPageIndices();
        const copiedPages = await outPdf.copyPages(srcPdf, indices);
        for (const page of copiedPages) {
          outPdf.addPage(page);
        }
      } else if (isJpg || isPng) {
        const embeddedImage = isJpg
          ? await outPdf.embedJpg(bytes)
          : await outPdf.embedPng(bytes);

        const imgW = embeddedImage.width;
        const imgH = embeddedImage.height;

        let pageW = imgW;
        let pageH = imgH;

        if (pageSizePreset !== 'original') {
          const baseDim = PAGE_DIMENSIONS_PT[pageSizePreset];
          const useLandscape =
            orientation === 'landscape' ||
            (orientation === 'auto' && imgW > imgH);
          pageW = useLandscape ? baseDim.height : baseDim.width;
          pageH = useLandscape ? baseDim.width : baseDim.height;
        } else if (orientation === 'landscape' && pageW < pageH) {
          [pageW, pageH] = [pageH, pageW];
        } else if (orientation === 'portrait' && pageW > pageH) {
          [pageW, pageH] = [pageH, pageW];
        }

        const page = outPdf.addPage([pageW, pageH]);

        // Composite background (white by default so transparent PNGs have a clean background)
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageW,
          height: pageH,
          color: rgb(bgColor.r, bgColor.g, bgColor.b),
        });

        const effectiveMargin = pageSizePreset === 'original' ? 0 : marginPt;
        const availW = Math.max(10, pageW - effectiveMargin * 2);
        const availH = Math.max(10, pageH - effectiveMargin * 2);

        // Fit mode: contain (never upscale beyond avail box if original, preserve aspect ratio)
        const scale = Math.min(availW / imgW, availH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (pageW - drawW) / 2;
        const drawY = (pageH - drawH) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      } else {
        throw new Error(`Unsupported file in queue: ${file.name}`);
      }
    }

    onProgress({
      stage: 'Processing document',
      completed: input.files.length,
      total: input.files.length,
      message: 'Serializing PDF structure...',
    });

    const pdfBytes = await outPdf.save({ useObjectStreams: true });
    const defaultBaseName =
      this.toolId === 'merge-pdf' ? 'flowpdf-merged' : 'flowpdf-images';
    const outputName = sanitizeFilename(
      input.options.outputFilename || defaultBaseName,
      '.pdf'
    );

    const artifact: OutputArtifact = {
      name: outputName,
      mimeType: 'application/pdf',
      bytes: pdfBytes,
      pageCount: outPdf.getPageCount(),
    };

    onProgress({
      stage: 'Checking output integrity',
      message: 'Verifying generated PDF...',
    });

    const verification = await verifyOutputArtifact(artifact);
    if (!verification.valid) {
      throw new Error(verification.error || en.errors.outputValidationFailed);
    }

    if (this.toolId === 'merge-pdf') {
      warnings.push(en.warnings.signatureInvalidation);
    }

    onProgress({
      stage: 'Preparing download',
      message: 'Output verified and ready.',
    });

    return {
      outputs: [artifact],
      warnings,
      metadata: {
        totalOutputPages: verification.pageCount,
        inputBytesTotal,
        outputBytesTotal: pdfBytes.byteLength,
        durationMs: Math.round(performance.now() - startTime),
      },
    };
  }
}
