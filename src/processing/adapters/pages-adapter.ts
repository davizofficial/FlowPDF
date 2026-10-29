import { degrees, PDFDocument } from 'pdf-lib';
import type {
  OutputArtifact,
  ProcessingAdapter,
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
  ToolId,
} from '../shared-types';
import { parsePageRanges, sanitizeFilename } from '../../lib/format';
import { packageArtifactsAsZip, verifyOutputArtifact } from '../output';
import { en } from '../../i18n/en';

export type SplitMode = 'ranges' | 'fixed-count' | 'single-pages';
export type CopyMode = 'exact-bytes' | 'rewrite-structure';

export interface OrganizedPageItem {
  originalPageIndex: number; // 0-based
  rotationDelta: number; // 0, 90, 180, 270
}

export interface PagesAdapterOptions {
  outputFilename?: string;
  // Split PDF options
  splitMode?: SplitMode;
  rangeSpec?: string;
  fixedPageCount?: number;
  packageAsZip?: boolean;
  // Organize PDF options
  pageSequence?: OrganizedPageItem[];
  // Remove / Extract options
  targetPagesSpec?: string;
  // Copy PDF options
  copyMode?: CopyMode;
  // Insert / Replace Pages options
  insertReplaceMode?: 'insert' | 'replace';
  insertAfterPage?: number;
}

export class PagesAdapter implements ProcessingAdapter<PagesAdapterOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<PagesAdapterOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
  }

  async run(
    input: ProcessingInput<PagesAdapterOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    const file = input.files[0];
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    const warnings: string[] = [];

    onProgress({
      stage: 'Reading files',
      message: `Loading ${file.name}...`,
    });

    // Special case: exact byte copy for Copy PDF
    if (this.toolId === 'copy-pdf') {
      const copyMode = input.options.copyMode ?? 'exact-bytes';
      const baseName =
        input.options.outputFilename ||
        `${file.name.replace(/\.pdf$/i, '')}-copy`;
      const outName = sanitizeFilename(baseName, '.pdf');

      if (copyMode === 'exact-bytes') {
        const clonedBytes = new Uint8Array(inputBytes.byteLength);
        clonedBytes.set(inputBytes);
        const srcDoc = await PDFDocument.load(clonedBytes, { updateMetadata: false });
        const artifact: OutputArtifact = {
          name: outName,
          mimeType: 'application/pdf',
          bytes: clonedBytes,
          pageCount: srcDoc.getPageCount(),
        };
        const check = await verifyOutputArtifact(artifact);
        if (!check.valid) {
          throw new Error(check.error || en.errors.outputValidationFailed);
        }
        warnings.push(
          'Exact byte-for-byte duplicate created. All original object streams and metadata were preserved.'
        );
        return {
          outputs: [artifact],
          warnings,
          metadata: {
            totalOutputPages: check.pageCount,
            inputBytesTotal: inputBytes.byteLength,
            outputBytesTotal: clonedBytes.byteLength,
            copyMode: 'exact-bytes',
            durationMs: Math.round(performance.now() - startTime),
          },
        };
      } else {
        const srcDoc = await PDFDocument.load(inputBytes, { updateMetadata: false });
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copied.forEach((p) => newDoc.addPage(p));
        const rewrittenBytes = await newDoc.save({ useObjectStreams: true });
        const artifact: OutputArtifact = {
          name: outName,
          mimeType: 'application/pdf',
          bytes: rewrittenBytes,
          pageCount: newDoc.getPageCount(),
        };
        const check = await verifyOutputArtifact(artifact);
        if (!check.valid) {
          throw new Error(check.error || en.errors.outputValidationFailed);
        }
        warnings.push(
          'Rewritten structure copy created. PDF object streams were regenerated and any cryptographic digital signatures were invalidated.'
        );
        return {
          outputs: [artifact],
          warnings,
          metadata: {
            totalOutputPages: check.pageCount,
            inputBytesTotal: inputBytes.byteLength,
            outputBytesTotal: rewrittenBytes.byteLength,
            copyMode: 'rewrite-structure',
            durationMs: Math.round(performance.now() - startTime),
          },
        };
      }
    }

    const srcPdf = await PDFDocument.load(inputBytes, { updateMetadata: false });
    const totalPages = srcPdf.getPageCount();

    if (this.toolId === 'split-pdf') {
      const splitMode = input.options.splitMode ?? 'ranges';
      const basePrefix = (
        input.options.outputFilename ||
        file.name.replace(/\.pdf$/i, '') ||
        'flowpdf-split'
      ).replace(/\.pdf$/i, '');

      const groups: Array<{ label: string; indices: number[] }> = [];

      if (splitMode === 'single-pages') {
        for (let i = 0; i < totalPages; i++) {
          groups.push({ label: `page-${i + 1}`, indices: [i] });
        }
      } else if (splitMode === 'fixed-count') {
        const chunkSize = Math.max(1, Math.floor(input.options.fixedPageCount ?? 1));
        for (let i = 0; i < totalPages; i += chunkSize) {
          const end = Math.min(totalPages, i + chunkSize);
          const indices: number[] = [];
          for (let j = i; j < end; j++) indices.push(j);
          groups.push({ label: `pages-${i + 1}-${end}`, indices });
        }
      } else {
        // 'ranges': each comma-separated segment produces a split output PDF
        const spec = input.options.rangeSpec?.trim() || `1-${totalPages}`;
        const segments = spec.split(',').map((s) => s.trim()).filter(Boolean);
        if (segments.length === 0) {
          throw new Error(en.errors.invalidRangeSyntax);
        }
        for (const seg of segments) {
          const parsed = parsePageRanges(seg, totalPages);
          if (!parsed.valid) {
            throw new Error(parsed.error || en.errors.invalidRangeSyntax);
          }
          groups.push({
            label: `pages-${seg.replace(/\s+/g, '')}`,
            indices: parsed.pages,
          });
        }
      }

      const splitArtifacts: OutputArtifact[] = [];
      let totalOutputPages = 0;

      for (let g = 0; g < groups.length; g++) {
        if (input.signal?.aborted) throw new Error(en.errors.cancelled);
        const group = groups[g];
        onProgress({
          stage: 'Processing document',
          completed: g,
          total: groups.length,
          message: `Creating split file ${g + 1} of ${groups.length}...`,
        });

        const partDoc = await PDFDocument.create();
        const copied = await partDoc.copyPages(srcPdf, group.indices);
        copied.forEach((p) => partDoc.addPage(p));
        const partBytes = await partDoc.save({ useObjectStreams: true });

        const artifact: OutputArtifact = {
          name: sanitizeFilename(`${basePrefix}-${group.label}`, '.pdf'),
          mimeType: 'application/pdf',
          bytes: partBytes,
          pageCount: group.indices.length,
        };
        const check = await verifyOutputArtifact(artifact);
        if (!check.valid) {
          throw new Error(check.error || en.errors.outputValidationFailed);
        }
        splitArtifacts.push(artifact);
        totalOutputPages += group.indices.length;
      }

      const outputs: OutputArtifact[] = [...splitArtifacts];
      if (splitArtifacts.length > 1 && (input.options.packageAsZip ?? true)) {
        const zipArtifact = await packageArtifactsAsZip(
          splitArtifacts,
          sanitizeFilename(`${basePrefix}-split-bundle`, '.zip')
        );
        outputs.unshift(zipArtifact);
      }

      const outputBytesTotal = splitArtifacts.reduce(
        (acc, a) => acc + a.bytes.byteLength,
        0
      );

      return {
        outputs,
        warnings,
        metadata: {
          totalOutputPages,
          splitFileCount: splitArtifacts.length,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'organize-pdf') {
      const sequence: OrganizedPageItem[] =
        input.options.pageSequence && input.options.pageSequence.length > 0
          ? input.options.pageSequence
          : srcPdf.getPageIndices().map((idx) => ({
              originalPageIndex: idx,
              rotationDelta: 0,
            }));

      if (sequence.length === 0) {
        throw new Error(en.errors.zeroPageOutput);
      }

      for (const item of sequence) {
        if (item.originalPageIndex < 0 || item.originalPageIndex >= totalPages) {
          throw new Error(
            `Page index ${item.originalPageIndex + 1} is out of bounds.`
          );
        }
      }

      onProgress({
        stage: 'Processing document',
        message: `Building organized PDF (${sequence.length} page(s))...`,
      });

      const outDoc = await PDFDocument.create();
      const indicesToCopy = sequence.map((item) => item.originalPageIndex);
      const copiedPages = await outDoc.copyPages(srcPdf, indicesToCopy);

      copiedPages.forEach((page, idx) => {
        const delta = sequence[idx].rotationDelta || 0;
        if (delta !== 0) {
          const currentAngle = page.getRotation().angle;
          page.setRotation(degrees((currentAngle + delta + 360) % 360));
        }
        outDoc.addPage(page);
      });

      const outBytes = await outDoc.save({ useObjectStreams: true });
      const artifact: OutputArtifact = {
        name: sanitizeFilename(
          input.options.outputFilename || 'flowpdf-organized',
          '.pdf'
        ),
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: outDoc.getPageCount(),
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: check.pageCount,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'remove-pages') {
      if (totalPages <= 1) {
        throw new Error(
          'This PDF contains only 1 page. Upload a PDF with 2 or more pages to remove individual pages.'
        );
      }
      const spec = input.options.targetPagesSpec || input.options.rangeSpec || '1';
      const parsed = parsePageRanges(spec, totalPages);
      if (!parsed.valid) {
        throw new Error(parsed.error || en.errors.invalidRangeSyntax);
      }

      const toRemoveSet = new Set(parsed.pages);
      const remainingIndices = srcPdf
        .getPageIndices()
        .filter((idx) => !toRemoveSet.has(idx));

      if (remainingIndices.length === 0) {
        throw new Error(en.errors.zeroPageOutput);
      }

      const outDoc = await PDFDocument.create();
      const copied = await outDoc.copyPages(srcPdf, remainingIndices);
      copied.forEach((p) => outDoc.addPage(p));
      const outBytes = await outDoc.save({ useObjectStreams: true });

      const artifact: OutputArtifact = {
        name: sanitizeFilename(
          input.options.outputFilename || 'flowpdf-pages-removed',
          '.pdf'
        ),
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: outDoc.getPageCount(),
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: check.pageCount,
          removedCount: toRemoveSet.size,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'extract-pages') {
      const spec = input.options.targetPagesSpec || input.options.rangeSpec || '1';
      const parsed = parsePageRanges(spec, totalPages, { allowDuplicates: true });
      if (!parsed.valid) {
        throw new Error(parsed.error || en.errors.invalidRangeSyntax);
      }

      const outDoc = await PDFDocument.create();
      const copied = await outDoc.copyPages(srcPdf, parsed.pages);
      copied.forEach((p) => outDoc.addPage(p));
      const outBytes = await outDoc.save({ useObjectStreams: true });

      const artifact: OutputArtifact = {
        name: sanitizeFilename(
          input.options.outputFilename || 'flowpdf-extracted',
          '.pdf'
        ),
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: outDoc.getPageCount(),
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: check.pageCount,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'insert-replace-pages') {
      if (input.files.length < 2) {
        throw new Error('Select at least two PDF files: the main document first, followed by the document containing pages to insert or replace.');
      }

      const secondBytes = new Uint8Array(await input.files[1].arrayBuffer());
      const secondPdf = await PDFDocument.load(secondBytes, { updateMetadata: false });
      const mode = input.options.insertReplaceMode ?? 'insert';
      const outDoc = await PDFDocument.create();

      if (mode === 'replace') {
        const spec = input.options.targetPagesSpec || '1';
        const parsed = parsePageRanges(spec, totalPages);
        if (!parsed.valid) {
          throw new Error(parsed.error || en.errors.invalidRangeSyntax);
        }
        const replaceSet = new Set(parsed.pages);
        const firstReplacedIdx = Math.min(...parsed.pages);
        let insertedReplacement = false;

        for (let i = 0; i < totalPages; i++) {
          if (replaceSet.has(i)) {
            if (!insertedReplacement && i === firstReplacedIdx) {
              const replacementPages = await outDoc.copyPages(
                secondPdf,
                secondPdf.getPageIndices()
              );
              replacementPages.forEach((p) => outDoc.addPage(p));
              insertedReplacement = true;
            }
          } else {
            const [copiedPage] = await outDoc.copyPages(srcPdf, [i]);
            outDoc.addPage(copiedPage);
          }
        }
      } else {
        const afterPage = Math.max(
          0,
          Math.min(totalPages, Math.floor(input.options.insertAfterPage ?? totalPages))
        );

        if (afterPage === 0) {
          const inserted = await outDoc.copyPages(secondPdf, secondPdf.getPageIndices());
          inserted.forEach((p) => outDoc.addPage(p));
        }

        for (let i = 0; i < totalPages; i++) {
          const [origPage] = await outDoc.copyPages(srcPdf, [i]);
          outDoc.addPage(origPage);
          if (i + 1 === afterPage) {
            const inserted = await outDoc.copyPages(secondPdf, secondPdf.getPageIndices());
            inserted.forEach((p) => outDoc.addPage(p));
          }
        }
      }

      const outBytes = await outDoc.save({ useObjectStreams: true });
      const artifact: OutputArtifact = {
        name: sanitizeFilename(
          input.options.outputFilename || `${file.name.replace(/\.pdf$/i, '')}-updated`,
          '.pdf'
        ),
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: outDoc.getPageCount(),
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: check.pageCount,
          inputBytesTotal: inputBytes.byteLength + secondBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    throw new Error(`Unsupported page operation: ${this.toolId}`);
  }
}
