import { PDFDocument } from 'pdf-lib';
import type { QueueItemStatus, ToolDefinition } from '../shared-types';

export interface FileInspectionResult {
  status: QueueItemStatus;
  mimeType: string;
  pageCount?: number;
  dimensions?: { width: number; height: number };
  errorMessage?: string;
}

/**
 * Inspects magic bytes and structural validity of an input file locally.
 * Never attempts to crack or bypass PDF encryption (FR-FILE-003, C4.1).
 */
export async function inspectAndValidateFile(
  file: File,
  tool: ToolDefinition
): Promise<FileInspectionResult> {
  if (file.size === 0) {
    return {
      status: 'invalid',
      mimeType: file.type || 'application/octet-stream',
      errorMessage: 'This file is empty (0 bytes) and cannot be processed.',
    };
  }

  const lowerName = file.name.toLowerCase();
  const extMatches = tool.acceptedExtensions.some((ext) => lowerName.endsWith(ext));
  const mimeMatches =
    file.type !== '' && tool.acceptedMimeTypes.includes(file.type.toLowerCase());

  if (!extMatches && !mimeMatches) {
    return {
      status: 'invalid',
      mimeType: file.type || 'application/octet-stream',
      errorMessage: `Unsupported file type for ${tool.name}. Accepted formats: ${tool.acceptedExtensions.join(', ')}.`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // 1. Check PDF files
  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    if (!hasPdfMagicHeader(bytes)) {
      return {
        status: 'damaged',
        mimeType: 'application/pdf',
        errorMessage: 'This file does not contain a valid %PDF- header.',
      };
    }

    try {
      const pdfDoc = await PDFDocument.load(bytes, {
        updateMetadata: false,
        throwOnInvalidObject: false,
      });
      const pageCount = pdfDoc.getPageCount();
      if (pageCount <= 0) {
        return {
          status: 'invalid',
          mimeType: 'application/pdf',
          errorMessage: 'This PDF contains 0 pages.',
        };
      }
      return {
        status: 'ready',
        mimeType: 'application/pdf',
        pageCount,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/encrypted|password/i.test(msg)) {
        return {
          status: 'password-protected',
          mimeType: 'application/pdf',
          errorMessage:
            'This PDF is password-protected. FlowPDF does not bypass encryption without a valid unlock workflow.',
        };
      }
      return {
        status: 'damaged',
        mimeType: 'application/pdf',
        errorMessage:
          'This PDF could not be read. It may be damaged or password-protected.',
      };
    }
  }

  // 2. Check JPEG files
  if (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    file.type === 'image/jpeg'
  ) {
    if (!hasJpegMagicHeader(bytes)) {
      return {
        status: 'invalid',
        mimeType: 'image/jpeg',
        errorMessage: 'File signature does not match a valid JPEG image.',
      };
    }
    try {
      const pdfDoc = await PDFDocument.create();
      const embedded = await pdfDoc.embedJpg(bytes);
      return {
        status: 'ready',
        mimeType: 'image/jpeg',
        pageCount: 1,
        dimensions: { width: embedded.width, height: embedded.height },
      };
    } catch {
      return {
        status: 'damaged',
        mimeType: 'image/jpeg',
        errorMessage: 'This JPEG image could not be decoded.',
      };
    }
  }

  // 3. Check PNG files
  if (lowerName.endsWith('.png') || file.type === 'image/png') {
    if (!hasPngMagicHeader(bytes)) {
      return {
        status: 'invalid',
        mimeType: 'image/png',
        errorMessage: 'File signature does not match a valid PNG image.',
      };
    }
    try {
      const pdfDoc = await PDFDocument.create();
      const embedded = await pdfDoc.embedPng(bytes);
      return {
        status: 'ready',
        mimeType: 'image/png',
        pageCount: 1,
        dimensions: { width: embedded.width, height: embedded.height },
      };
    } catch {
      return {
        status: 'damaged',
        mimeType: 'image/png',
        errorMessage: 'This PNG image could not be decoded.',
      };
    }
  }

  // 4. Check Markdown / Text / HTML / CSV files
  if (
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.markdown') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.html') ||
    lowerName.endsWith('.htm') ||
    lowerName.endsWith('.csv') ||
    file.type === 'text/markdown' ||
    file.type === 'text/plain' ||
    file.type === 'text/html' ||
    file.type === 'text/csv'
  ) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (!text.trim()) {
      return {
        status: 'invalid',
        mimeType: file.type || 'text/plain',
        errorMessage: 'The selected file contains only whitespace.',
      };
    }
    return {
      status: 'ready',
      mimeType: file.type || 'text/plain',
      pageCount: 1,
    };
  }

  // 5. Check OpenXML Office documents (.docx, .xlsx, .pptx)
  if (
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.pptx') ||
    file.type.includes('officedocument')
  ) {
    if (!hasZipMagicHeader(bytes)) {
      return {
        status: 'invalid',
        mimeType: file.type || 'application/octet-stream',
        errorMessage:
          'File signature does not match a valid OpenXML Office archive (.docx, .xlsx, .pptx).',
      };
    }
    return {
      status: 'ready',
      mimeType: file.type || 'application/octet-stream',
      pageCount: 1,
    };
  }

  return {
    status: 'invalid',
    mimeType: file.type || 'application/octet-stream',
    errorMessage: 'Unsupported file format.',
  };
}

export function hasPdfMagicHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  // Look for %PDF- within first 1024 bytes (per PDF spec)
  const limit = Math.min(bytes.length - 5, 1024);
  for (let i = 0; i <= limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

export function hasJpegMagicHeader(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function hasPngMagicHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

export function hasZipMagicHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}
