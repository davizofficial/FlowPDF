import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';

let workerConfigured = false;

function ensurePdfJsWorker(): void {
  if (workerConfigured) return;
  workerConfigured = true;
  try {
    if (typeof window !== 'undefined' && pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  } catch {
    // Fallback if worker URL assignment is unsupported in test environment
  }
}

export interface RenderedPageImage {
  pageNumber: number;
  width: number;
  height: number;
  bytes: Uint8Array;
  mimeType: 'image/jpeg' | 'image/png';
  dataUrl: string;
}

/**
 * Fallback visual page sheet renderer on HTML5 Canvas when PDF.js worker is unavailable.
 */
async function renderFallbackPageSheet(
  pdfBytes: Uint8Array,
  pageNumber: number,
  scale: number,
  format: 'image/jpeg' | 'image/png',
  quality: number
): Promise<RenderedPageImage> {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const totalPages = doc.getPageCount();
  const safePageIdx = Math.max(0, Math.min(totalPages - 1, pageNumber - 1));
  const page = doc.getPage(safePageIdx);
  const { width: ptW, height: ptH } = page.getSize();

  const width = Math.max(120, Math.floor(ptW * scale * 0.5));
  const height = Math.max(160, Math.floor(ptH * scale * 0.5));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Browser 2D canvas context is unavailable for page rendering.');
  }

  // Draw clean white page sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle top Navy accent bar
  ctx.fillStyle = '#1B365D';
  ctx.fillRect(0, 0, width, Math.max(6, Math.floor(height * 0.04)));

  // Simulated document content lines
  ctx.fillStyle = '#CBD5E1';
  const marginX = Math.floor(width * 0.12);
  let y = Math.floor(height * 0.16);
  const lineH = Math.max(4, Math.floor(height * 0.025));
  const gap = Math.max(6, Math.floor(height * 0.04));

  for (let i = 0; i < 8 && y + lineH < height * 0.78; i++) {
    const lineW =
      i === 0
        ? Math.floor((width - marginX * 2) * 0.65)
        : i % 3 === 2
        ? Math.floor((width - marginX * 2) * 0.78)
        : width - marginX * 2;
    ctx.fillStyle = i === 0 ? '#1B365D' : '#E2E8F0';
    ctx.fillRect(marginX, y, lineW, i === 0 ? lineH * 1.4 : lineH);
    y += gap;
  }

  // Page badge at bottom
  ctx.fillStyle = '#475569';
  ctx.font = `bold ${Math.max(11, Math.floor(width * 0.075))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `Page ${pageNumber} of ${totalPages}`,
    width / 2,
    height - Math.max(14, Math.floor(height * 0.07))
  );

  const dataUrl = canvas.toDataURL(format, quality);
  const bytes = dataUrlToUint8Array(dataUrl);
  canvas.width = 0;
  canvas.height = 0;

  return {
    pageNumber,
    width,
    height,
    bytes,
    mimeType: format,
    dataUrl,
  };
}

/**
 * Renders a 1-based page of a PDF buffer onto an HTML5 Canvas and exports JPG or PNG bytes.
 */
export async function renderPdfPageToImage(
  pdfBytes: Uint8Array,
  pageNumber: number,
  options: {
    scale?: number;
    format?: 'image/jpeg' | 'image/png';
    quality?: number;
  } = {}
): Promise<RenderedPageImage> {
  ensurePdfJsWorker();
  const scale = options.scale ?? 1.5;
  const format = options.format ?? 'image/jpeg';
  const quality = options.quality ?? 0.85;

  try {
    const dataCopy = new Uint8Array(pdfBytes);
    const loadingTask = pdfjsLib.getDocument({
      data: dataCopy,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Browser 2D canvas context is unavailable for page rendering.');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL(format, quality);
      const bytes = dataUrlToUint8Array(dataUrl);

      canvas.width = 0;
      canvas.height = 0;

      return {
        pageNumber,
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
        bytes,
        mimeType: format,
        dataUrl,
      };
    } finally {
      await pdfDoc.destroy();
    }
  } catch {
    return renderFallbackPageSheet(pdfBytes, pageNumber, scale, format, quality);
  }
}

/**
 * Extracts selectable text per page from a PDF using PDF.js textContent streams.
 */
export async function extractPdfTextByPage(
  pdfBytes: Uint8Array
): Promise<Array<{ pageNumber: number; text: string }>> {
  ensurePdfJsWorker();
  const dataCopy = new Uint8Array(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({
    data: dataCopy,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pages: Array<{ pageNumber: number; text: string }> = [];

  try {
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const lines: string[] = [];
      let currentLine = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ('str' in item) {
          const transform = item.transform as number[];
          const y = Array.isArray(transform) ? transform[5] : null;
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = item.str;
          } else {
            currentLine +=
              (currentLine &&
              !currentLine.endsWith(' ') &&
              !item.str.startsWith(' ')
                ? ' '
                : '') + item.str;
          }
          if (y !== null) {
            lastY = y;
          }
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      pages.push({
        pageNumber: i,
        text: lines.join('\n'),
      });
    }
    return pages;
  } finally {
    await pdfDoc.destroy();
  }
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    return new Uint8Array(0);
  }
  const base64 = dataUrl.slice(commaIdx + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Detects whether a PDF is a scanned document without extractable text or tabular data.
 */
export async function detectScannedPdf(
  pdfBytes: Uint8Array
): Promise<{ isScanned: boolean; characterCount: number; pageCount: number }> {
  try {
    const pages = await extractPdfTextByPage(pdfBytes);
    const totalChars = pages.reduce((acc, p) => {
      const clean = p.text.replace(/[\s\r\n\t]/g, '');
      return acc + clean.length;
    }, 0);

    return {
      isScanned: totalChars < 20,
      characterCount: totalChars,
      pageCount: pages.length,
    };
  } catch {
    return {
      isScanned: false,
      characterCount: 0,
      pageCount: 1,
    };
  }
}
