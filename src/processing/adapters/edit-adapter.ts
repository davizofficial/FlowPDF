import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type {
  OutputArtifact,
  ProcessingAdapter,
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
  ToolId,
} from '../shared-types';
import { parsePageRanges, sanitizeFilename } from '../../lib/format';
import { verifyOutputArtifact } from '../output';
import { en } from '../../i18n/en';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'n' | 'page-n' | 'page-n-of-total';

export type WatermarkPosition = 'center' | 'top-center' | 'bottom-center';

export interface EditPdfOptions {
  outputFilename?: string;
  pageRangeSpec?: string; // Empty means all pages

  // Rotate options
  rotationDegrees?: 90 | 180 | 270;

  // Page numbers options
  pageNumberPosition?: PageNumberPosition;
  pageNumberFormat?: PageNumberFormat;
  startNumber?: number;
  fontSize?: number;

  // Watermark options
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkRotation?: number;
  watermarkPosition?: WatermarkPosition;
  watermarkFontSize?: number;

  // Crop options (in millimeters)
  cropTopMm?: number;
  cropRightMm?: number;
  cropBottomMm?: number;
  cropLeftMm?: number;
}

const MM_TO_PT = 72 / 25.4;

export class EditPdfAdapter implements ProcessingAdapter<EditPdfOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<EditPdfOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
    if (this.toolId === 'add-watermark') {
      const text = (input.options.watermarkText ?? 'CONFIDENTIAL').trim();
      if (!text) {
        throw new Error('Enter watermark text before applying the watermark.');
      }
    }
  }

  async run(
    input: ProcessingInput<EditPdfOptions>,
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

    let targetIndices: number[] = pdfDoc.getPageIndices();
    if (input.options.pageRangeSpec && input.options.pageRangeSpec.trim()) {
      const parsed = parsePageRanges(input.options.pageRangeSpec, totalPages);
      if (!parsed.valid) {
        throw new Error(parsed.error || en.errors.invalidRangeSyntax);
      }
      targetIndices = parsed.pages;
    }

    const targetSet = new Set(targetIndices);

    if (this.toolId === 'rotate-pdf') {
      const delta = input.options.rotationDegrees ?? 90;
      onProgress({
        stage: 'Processing document',
        message: `Rotating ${targetSet.size} page(s) by ${delta}°...`,
      });

      for (const pageIdx of targetSet) {
        const page = pdfDoc.getPage(pageIdx);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + delta + 360) % 360));
      }
    } else if (this.toolId === 'add-page-numbers') {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const position: PageNumberPosition =
        input.options.pageNumberPosition ?? 'bottom-center';
      const format: PageNumberFormat =
        input.options.pageNumberFormat ?? 'page-n-of-total';
      const startNum = Math.max(1, Math.floor(input.options.startNumber ?? 1));
      const fontSize = Math.max(6, Math.min(36, input.options.fontSize ?? 10));

      onProgress({
        stage: 'Processing document',
        message: `Adding page numbers to ${targetSet.size} page(s)...`,
      });

      let counter = 0;
      for (let i = 0; i < totalPages; i++) {
        if (!targetSet.has(i)) continue;
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const displayNum = startNum + counter;
        counter++;

        const label =
          format === 'n'
            ? `${displayNum}`
            : format === 'page-n'
            ? `Page ${displayNum}`
            : `Page ${displayNum} of ${totalPages}`;

        const textWidth = font.widthOfTextAtSize(label, fontSize);
        const margin = 24;

        let x = (width - textWidth) / 2;
        if (position.endsWith('left')) x = margin;
        if (position.endsWith('right')) x = Math.max(margin, width - textWidth - margin);

        const y = position.startsWith('top')
          ? Math.max(margin, height - margin - fontSize)
          : margin;

        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.18, 0.21, 0.19),
        });
      }
    } else if (this.toolId === 'add-watermark') {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text = (input.options.watermarkText ?? 'CONFIDENTIAL').trim();
      const opacity = Math.max(0.05, Math.min(0.95, input.options.watermarkOpacity ?? 0.22));
      const fontSize = Math.max(14, Math.min(120, input.options.watermarkFontSize ?? 44));
      const rotationAngle = input.options.watermarkRotation ?? 35;
      const pos: WatermarkPosition = input.options.watermarkPosition ?? 'center';

      onProgress({
        stage: 'Processing document',
        message: `Stamping watermark on ${targetSet.size} page(s)...`,
      });

      for (const pageIdx of targetSet) {
        const page = pdfDoc.getPage(pageIdx);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        const x = Math.max(24, (width - textWidth * Math.cos((rotationAngle * Math.PI) / 180)) / 2);
        let y = height / 2;
        if (pos === 'top-center') y = height * 0.78;
        if (pos === 'bottom-center') y = height * 0.22;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.11, 0.21, 0.36),
          opacity,
          rotate: degrees(rotationAngle),
        });
      }
    } else if (this.toolId === 'crop-pdf') {
      const topPt = Math.max(0, (input.options.cropTopMm ?? 10) * MM_TO_PT);
      const rightPt = Math.max(0, (input.options.cropRightMm ?? 10) * MM_TO_PT);
      const bottomPt = Math.max(0, (input.options.cropBottomMm ?? 10) * MM_TO_PT);
      const leftPt = Math.max(0, (input.options.cropLeftMm ?? 10) * MM_TO_PT);

      onProgress({
        stage: 'Processing document',
        message: `Adjusting crop boxes on ${targetSet.size} page(s)...`,
      });

      for (const pageIdx of targetSet) {
        const page = pdfDoc.getPage(pageIdx);
        const mediaBox = page.getMediaBox();
        const newWidth = mediaBox.width - leftPt - rightPt;
        const newHeight = mediaBox.height - topPt - bottomPt;

        if (newWidth < 36 || newHeight < 36) {
          throw new Error(
            `Crop margins are too large for page ${pageIdx + 1}; remaining printable area would be smaller than 0.5 inch.`
          );
        }

        const newX = mediaBox.x + leftPt;
        const newY = mediaBox.y + bottomPt;
        page.setCropBox(newX, newY, newWidth, newHeight);
        page.setTrimBox(newX, newY, newWidth, newHeight);
      }

      warnings.push(en.warnings.cropNotRedaction);
    } else {
      throw new Error(`Unsupported edit tool: ${this.toolId}`);
    }

    const outBytes = await pdfDoc.save({ useObjectStreams: true });
    const defaultSuffix = this.toolId.replace('-pdf', '');
    const outName = sanitizeFilename(
      input.options.outputFilename ||
        `${file.name.replace(/\.pdf$/i, '')}-${defaultSuffix}`,
      '.pdf'
    );

    const artifact: OutputArtifact = {
      name: outName,
      mimeType: 'application/pdf',
      bytes: outBytes,
      pageCount: pdfDoc.getPageCount(),
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
        modifiedPageCount: targetSet.size,
        inputBytesTotal: inputBytes.byteLength,
        outputBytesTotal: outBytes.byteLength,
        durationMs: Math.round(performance.now() - startTime),
      },
    };
  }
}
