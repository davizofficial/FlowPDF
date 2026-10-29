import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
import { extractPdfTextByPage, renderPdfPageToImage } from './pdfjs-helper';
import { en } from '../../i18n/en';

export interface ConvertAdapterOptions {
  outputFilename?: string;
  pageRangeSpec?: string;
  renderScale?: number; // 1.0 (72 DPI), 1.5 (108 DPI), 2.0 (144 DPI)
  jpgQuality?: number; // 0.5 - 0.95
  packageAsZip?: boolean;
}

/**
 * Strips unsafe raw HTML tags from Markdown lines while preserving code/text content (NFR-SEC-002).
 */
export function sanitizeMarkdownHtml(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[sanitized-script]')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '[sanitized-iframe]')
    .replace(/<\/?[a-z][^>]*>/gi, '');
}

/**
 * Normalizes non-WinAnsi characters to safe ASCII equivalents so StandardFonts never throw encoding errors.
 */
function toWinAnsiSafe(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

export class ConvertAdapter implements ProcessingAdapter<ConvertAdapterOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<ConvertAdapterOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
  }

  async run(
    input: ProcessingInput<ConvertAdapterOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    const file = input.files[0];
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    const warnings: string[] = [];

    if (this.toolId === 'markdown-to-pdf') {
      onProgress({
        stage: 'Reading files',
        message: `Reading Markdown source ${file.name}...`,
      });

      const rawText = new TextDecoder('utf-8').decode(inputBytes);
      const sanitizedText = sanitizeMarkdownHtml(rawText);
      if (sanitizedText !== rawText) {
        warnings.push(
          'Raw HTML tags in the Markdown input were sanitized before PDF rendering (NFR-SEC-002).'
        );
      }

      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

      const pageW = 595.28; // A4 width
      const pageH = 841.89; // A4 height
      const margin = 50;
      const maxLineWidth = pageW - margin * 2;

      let currentPage = pdfDoc.addPage([pageW, pageH]);
      let cursorY = pageH - margin;

      const ensureVerticalSpace = (requiredPt: number) => {
        if (cursorY - requiredPt < margin) {
          currentPage = pdfDoc.addPage([pageW, pageH]);
          cursorY = pageH - margin;
        }
      };

      const rawLines = sanitizedText.replace(/\r\n/g, '\n').split('\n');
      let inCodeBlock = false;

      onProgress({
        stage: 'Processing document',
        message: 'Typesetting Markdown blocks into paginated PDF...',
      });

      for (const rawLine of rawLines) {
        const trimmed = rawLine.trim();
        if (trimmed.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          cursorY -= 6;
          continue;
        }

        if (!trimmed && !inCodeBlock) {
          cursorY -= 10;
          continue;
        }

        let font = fontRegular;
        let fontSize = 11;
        let lineHeight = 16;
        let textColor = rgb(0.12, 0.15, 0.13);
        let indent = 0;
        let content = rawLine;

        if (inCodeBlock) {
          font = fontMono;
          fontSize = 9.5;
          lineHeight = 14;
          indent = 12;
          content = rawLine;
        } else if (trimmed.startsWith('# ')) {
          font = fontBold;
          fontSize = 20;
          lineHeight = 28;
          cursorY -= 6;
          content = trimmed.slice(2);
        } else if (trimmed.startsWith('## ')) {
          font = fontBold;
          fontSize = 15;
          lineHeight = 22;
          cursorY -= 4;
          content = trimmed.slice(3);
        } else if (trimmed.startsWith('### ')) {
          font = fontBold;
          fontSize = 12.5;
          lineHeight = 18;
          content = trimmed.slice(4);
        } else if (/^[-*+]\s+/.test(trimmed)) {
          indent = 14;
          content = `* ${trimmed.replace(/^[-*+]\s+/, '')}`;
        } else if (/^\d+\.\s+/.test(trimmed)) {
          indent = 14;
          content = trimmed;
        } else if (trimmed.startsWith('> ')) {
          indent = 16;
          textColor = rgb(0.36, 0.4, 0.37);
          content = trimmed.slice(2);
        }

        // Strip inline markdown bold/italic markers when not in code block
        if (!inCodeBlock) {
          content = content
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1');
        }

        const safeContent = toWinAnsiSafe(content);
        const words = safeContent.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
          continue;
        }

        let currentLine = words[0];
        const availableW = maxLineWidth - indent;

        for (let w = 1; w < words.length; w++) {
          const candidate = `${currentLine} ${words[w]}`;
          if (font.widthOfTextAtSize(candidate, fontSize) <= availableW) {
            currentLine = candidate;
          } else {
            ensureVerticalSpace(lineHeight);
            currentPage.drawText(currentLine, {
              x: margin + indent,
              y: cursorY - fontSize,
              size: fontSize,
              font,
              color: textColor,
            });
            cursorY -= lineHeight;
            currentLine = words[w];
          }
        }

        if (currentLine) {
          ensureVerticalSpace(lineHeight);
          currentPage.drawText(currentLine, {
            x: margin + indent,
            y: cursorY - fontSize,
            size: fontSize,
            font,
            color: textColor,
          });
          cursorY -= lineHeight;
        }
      }

      const outBytes = await pdfDoc.save({ useObjectStreams: true });
      const outName = sanitizeFilename(
        input.options.outputFilename ||
          file.name.replace(/\.(md|markdown|txt)$/i, ''),
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
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'pdf-to-markdown' || this.toolId === 'pdf-to-text') {
      onProgress({
        stage: 'Reading files',
        message: `Extracting selectable text from ${file.name}...`,
      });

      const srcPdf = await PDFDocument.load(inputBytes, { updateMetadata: false });
      const totalPages = srcPdf.getPageCount();

      let pagesText: Array<{ pageNumber: number; text: string }> = [];
      try {
        pagesText = await extractPdfTextByPage(inputBytes);
      } catch {
        pagesText = Array.from({ length: totalPages }, (_, idx) => ({
          pageNumber: idx + 1,
          text: '',
        }));
      }

      const isMarkdown = this.toolId === 'pdf-to-markdown';
      const title = srcPdf.getTitle() || file.name.replace(/\.pdf$/i, '');
      const sections: string[] = [];

      if (isMarkdown) {
        sections.push(`# ${title}\n`);
      }

      let nonEmptyPages = 0;
      for (const pageItem of pagesText) {
        if (pageItem.text.trim()) {
          nonEmptyPages++;
        }
        if (isMarkdown) {
          sections.push(
            `## Page ${pageItem.pageNumber}\n\n${
              pageItem.text.trim() || '_[No selectable text extracted on this page]_'
            }\n`
          );
        } else {
          sections.push(
            `--- Page ${pageItem.pageNumber} ---\n${
              pageItem.text.trim() || '[No selectable text extracted on this page]'
            }\n`
          );
        }
      }

      if (nonEmptyPages === 0) {
        warnings.push(
          'No selectable text streams were found in this PDF. It may be an image-only scan requiring OCR.'
        );
      }

      const fullText = sections.join('\n');
      const outBytes = new TextEncoder().encode(fullText);
      const ext = isMarkdown ? '.md' : '.txt';
      const mime = isMarkdown ? 'text/markdown' : 'text/plain';

      const outName = sanitizeFilename(
        input.options.outputFilename || file.name.replace(/\.pdf$/i, ''),
        ext
      );

      const artifact: OutputArtifact = {
        name: outName,
        mimeType: mime,
        bytes: outBytes,
        pageCount: totalPages,
      };

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: totalPages,
          extractedTextPreview: fullText.slice(0, 600),
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'pdf-to-jpg' || this.toolId === 'pdf-to-png') {
      const srcPdf = await PDFDocument.load(inputBytes, { updateMetadata: false });
      const totalPages = srcPdf.getPageCount();

      let targetIndices: number[] = srcPdf.getPageIndices();
      if (input.options.pageRangeSpec && input.options.pageRangeSpec.trim()) {
        const parsed = parsePageRanges(input.options.pageRangeSpec, totalPages);
        if (!parsed.valid) {
          throw new Error(parsed.error || en.errors.invalidRangeSyntax);
        }
        targetIndices = parsed.pages;
      }

      const isJpg = this.toolId === 'pdf-to-jpg';
      const format = isJpg ? 'image/jpeg' : 'image/png';
      const ext = isJpg ? '.jpg' : '.png';
      const scale = Math.max(0.75, Math.min(3.0, input.options.renderScale ?? 1.5));
      const quality = Math.max(0.4, Math.min(0.98, input.options.jpgQuality ?? 0.88));
      const basePrefix = (
        input.options.outputFilename ||
        file.name.replace(/\.pdf$/i, '') ||
        'flowpdf-page'
      ).replace(/\.(pdf|jpg|png)$/i, '');

      const imageArtifacts: OutputArtifact[] = [];

      for (let i = 0; i < targetIndices.length; i++) {
        if (input.signal?.aborted) throw new Error(en.errors.cancelled);
        const pageNum = targetIndices[i] + 1;

        onProgress({
          stage: 'Processing document',
          completed: i,
          total: targetIndices.length,
          message: `Rendering page ${pageNum} (${i + 1} of ${targetIndices.length})...`,
        });

        const rendered = await renderPdfPageToImage(inputBytes, pageNum, {
          scale,
          format,
          quality,
        });

        imageArtifacts.push({
          name: sanitizeFilename(`${basePrefix}-page-${pageNum}`, ext),
          mimeType: format,
          bytes: rendered.bytes,
          pageCount: 1,
        });
      }

      const outputs: OutputArtifact[] = [...imageArtifacts];
      if (imageArtifacts.length > 1 && (input.options.packageAsZip ?? true)) {
        const zipArtifact = await packageArtifactsAsZip(
          imageArtifacts,
          sanitizeFilename(`${basePrefix}-images`, '.zip')
        );
        outputs.unshift(zipArtifact);
      }

      const outputBytesTotal = imageArtifacts.reduce(
        (acc, a) => acc + a.bytes.byteLength,
        0
      );

      return {
        outputs,
        warnings,
        metadata: {
          totalOutputPages: imageArtifacts.length,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    throw new Error(`Unsupported conversion tool: ${this.toolId}`);
  }
}
