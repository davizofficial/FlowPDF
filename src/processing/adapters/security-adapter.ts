import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
import { extractPdfTextByPage } from './pdfjs-helper';
import { en } from '../../i18n/en';

export interface SecurityAdapterOptions {
  outputFilename?: string;
}

export class SecurityAdapter implements ProcessingAdapter<SecurityAdapterOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<SecurityAdapterOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
  }

  async run(
    input: ProcessingInput<SecurityAdapterOptions>,
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

    const pdfDoc = await PDFDocument.load(inputBytes, { updateMetadata: false });
    const totalPages = pdfDoc.getPageCount();

    if (this.toolId === 'sanitize-metadata') {
      warnings.push(en.warnings.metadataSanitizeLimit);

      const inspectedFields: string[] = [];
      if (pdfDoc.getTitle()) inspectedFields.push(`Title ("${pdfDoc.getTitle()}")`);
      if (pdfDoc.getAuthor()) inspectedFields.push(`Author ("${pdfDoc.getAuthor()}")`);
      if (pdfDoc.getSubject()) inspectedFields.push(`Subject ("${pdfDoc.getSubject()}")`);
      if (pdfDoc.getKeywords()) inspectedFields.push('Keywords');
      if (pdfDoc.getCreator()) inspectedFields.push(`Creator ("${pdfDoc.getCreator()}")`);
      if (pdfDoc.getProducer()) inspectedFields.push(`Producer ("${pdfDoc.getProducer()}")`);
      if (pdfDoc.getCreationDate()) inspectedFields.push('CreationDate');
      if (pdfDoc.getModificationDate()) inspectedFields.push('ModificationDate');

      onProgress({
        stage: 'Processing document',
        message: 'Clearing standard document metadata dictionary...',
      });

      // Copy pages into a fresh PDFDocument so legacy Info dictionary keys are dropped
      const cleanDoc = await PDFDocument.create();
      const copied = await cleanDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copied.forEach((p) => cleanDoc.addPage(p));

      cleanDoc.setTitle('');
      cleanDoc.setAuthor('');
      cleanDoc.setSubject('');
      cleanDoc.setKeywords([]);
      cleanDoc.setCreator('');
      cleanDoc.setProducer('');

      const outBytes = await cleanDoc.save({
        useObjectStreams: true,
        updateFieldAppearances: false,
      });

      const outName = sanitizeFilename(
        input.options.outputFilename ||
          `${file.name.replace(/\.pdf$/i, '')}-sanitized`,
        '.pdf'
      );

      const artifact: OutputArtifact = {
        name: outName,
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: cleanDoc.getPageCount(),
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
          sanitizedFields:
            inspectedFields.length > 0
              ? inspectedFields
              : ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'],
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'compare-pdf') {
      if (input.files.length < 2) {
        throw new Error('Select two PDF documents to compare.');
      }

      const file2 = input.files[1];
      const bytes2 = new Uint8Array(await file2.arrayBuffer());
      const pdfDoc2 = await PDFDocument.load(bytes2, { updateMetadata: false });
      const pages2 = pdfDoc2.getPageCount();
      const maxPages = Math.max(totalPages, pages2);

      const reportLines: string[] = [
        `Document A: ${file.name} (${totalPages} page(s))`,
        `Document B: ${file2.name} (${pages2} page(s))`,
        '',
      ];

      let matchingPages = 0;
      let modifiedPages = 0;

      let pagesTextA: string[] = [];
      let pagesTextB: string[] = [];
      try {
        pagesTextA = (await extractPdfTextByPage(inputBytes)).map((item) =>
          item.text.replace(/\s+/g, ' ').trim()
        );
      } catch {
        pagesTextA = [];
      }
      try {
        pagesTextB = (await extractPdfTextByPage(bytes2)).map((item) =>
          item.text.replace(/\s+/g, ' ').trim()
        );
      } catch {
        pagesTextB = [];
      }

      for (let p = 1; p <= maxPages; p++) {
        onProgress({
          stage: 'Processing document',
          completed: p,
          total: maxPages,
          message: `Comparing page ${p} of ${maxPages}...`,
        });

        const textA = pagesTextA[p - 1] ?? '';
        const textB = pagesTextB[p - 1] ?? '';

        if (p > totalPages) {
          modifiedPages++;
          reportLines.push(`Page ${p}: Present only in Document B`);
        } else if (p > pages2) {
          modifiedPages++;
          reportLines.push(`Page ${p}: Present only in Document A`);
        } else if (textA === textB) {
          matchingPages++;
          reportLines.push(`Page ${p}: Identical text content`);
        } else {
          modifiedPages++;
          reportLines.push(`Page ${p}: Differences detected`);
          if (textA) {
            reportLines.push(`  - Doc A excerpt: ${textA.slice(0, 80)}`);
          }
          if (textB) {
            reportLines.push(`  + Doc B excerpt: ${textB.slice(0, 80)}`);
          }
        }
      }

      reportLines.splice(
        2,
        0,
        `Summary: ${matchingPages} identical page(s), ${modifiedPages} page(s) with differences.`
      );

      const reportDoc = await PDFDocument.create();
      const fontBold = await reportDoc.embedFont(StandardFonts.HelveticaBold);
      const fontReg = await reportDoc.embedFont(StandardFonts.Helvetica);

      let page = reportDoc.addPage([595.28, 841.89]);
      let y = 785;

      page.drawText('PDF Comparison Report', {
        x: 50,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0.11, 0.21, 0.36),
      });
      y -= 28;

      for (const line of reportLines) {
        if (y < 55) {
          page = reportDoc.addPage([595.28, 841.89]);
          y = 785;
        }
        const safeLine = line.replace(/[^\x20-\x7E]/g, ' ');
        page.drawText(safeLine.slice(0, 88), {
          x: 50,
          y,
          size: 10.5,
          font: line.startsWith('Summary:') ? fontBold : fontReg,
          color: rgb(0.1, 0.14, 0.2),
        });
        y -= 17;
      }

      const outBytes = await reportDoc.save({ useObjectStreams: true });
      const outName = sanitizeFilename(
        input.options.outputFilename || 'flowpdf-comparison-report',
        '.pdf'
      );

      const artifact: OutputArtifact = {
        name: outName,
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount: reportDoc.getPageCount(),
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
          matchingPages,
          modifiedPages,
          inputBytesTotal: inputBytes.byteLength + bytes2.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    throw new Error(`Unsupported security tool: ${this.toolId}`);
  }
}
