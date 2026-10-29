import type { CompressionReport } from '../processing/shared-types';

export const BENCHMARK_MAX_BYTES = 150 * 1024 * 1024; // 150 MiB
export const BENCHMARK_MAX_FILES = 50;

/**
 * Formats byte count into clear binary units (B, KiB, MiB, GiB).
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return exponent === 0 ? `${bytes} B` : `${value.toFixed(2)} ${units[exponent]}`;
}

/**
 * FR-COMPRESS-003 & FR-COMPRESS-005:
 * Calculates exact byte savings and determines whether the baseline must be retained.
 */
export function calculateCompressionReport(
  inputBytes: number,
  candidateOutputBytes: number,
  profileUsed: string,
  candidateValid = true
): CompressionReport {
  if (!candidateValid || candidateOutputBytes <= 0) {
    return {
      inputBytes,
      outputBytes: inputBytes,
      savedBytes: 0,
      savingsPercent: 0,
      retainedBaseline: true,
      profileUsed,
      reason: 'Generated output failed validation. The valid uncompressed baseline was retained.',
    };
  }

  if (candidateOutputBytes >= inputBytes) {
    return {
      inputBytes,
      outputBytes: inputBytes,
      savedBytes: 0,
      savingsPercent: 0,
      retainedBaseline: true,
      profileUsed,
      reason:
        candidateOutputBytes > inputBytes
          ? 'The compressed output is larger. The valid, uncompressed result has been retained.'
          : 'The selected compression pass did not reduce file size. The valid baseline has been retained.',
    };
  }

  const savedBytes = inputBytes - candidateOutputBytes;
  const savingsPercent =
    inputBytes > 0 ? Number(((savedBytes / inputBytes) * 100).toFixed(2)) : 0;

  return {
    inputBytes,
    outputBytes: candidateOutputBytes,
    savedBytes,
    savingsPercent,
    retainedBaseline: false,
    profileUsed,
  };
}

/**
 * C4.3 & FR-FILE-010:
 * Sanitizes path separators, control characters, and reserved characters, and enforces extension.
 */
export function sanitizeFilename(rawName: string, expectedExt: string): string {
  const normalizedExt = expectedExt.startsWith('.')
    ? expectedExt.toLowerCase()
    : `.${expectedExt.toLowerCase()}`;

  // Strip directory components and control/reserved characters
  let cleaned = rawName
    .replace(/^.*[\\/]/, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '-')
    .replace(/\.+/g, '.')
    .trim();

  // Remove trailing extension if it already matches expectedExt
  if (cleaned.toLowerCase().endsWith(normalizedExt)) {
    cleaned = cleaned.slice(0, cleaned.length - normalizedExt.length);
  }

  // Strip leading/trailing dots or hyphens
  cleaned = cleaned.replace(/^[.\-\s]+|[.\-\s]+$/g, '');

  // Disallow Windows reserved device names
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(cleaned)) {
    cleaned = `flowpdf-${cleaned.toLowerCase()}`;
  }

  if (!cleaned) {
    cleaned = 'flowpdf-output';
  }

  return `${cleaned}${normalizedExt}`;
}

/**
 * C4.3 & FR-WF-006:
 * Deterministically deconflicts duplicate filenames in a batch or ZIP archive.
 */
export function deconflictBatchFilenames(filenames: string[]): string[] {
  const seenCounts = new Map<string, number>();
  return filenames.map((filename) => {
    const lastDot = filename.lastIndexOf('.');
    const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
    const ext = lastDot > 0 ? filename.slice(lastDot) : '';
    const key = filename.toLowerCase();

    const count = seenCounts.get(key) ?? 0;
    seenCounts.set(key, count + 1);

    if (count === 0) {
      return filename;
    }
    return `${base}-${count + 1}${ext}`;
  });
}

/**
 * FR-PAGES-002 & FR-PAGES-004:
 * Parses a 1-based user page range string (e.g. "1, 3-5, 2") into 0-based page indices.
 * Preserves user selection order while preventing out-of-bounds or invalid syntax.
 */
export function parsePageRanges(
  rangeSpec: string,
  maxPages: number,
  options: { allowDuplicates?: boolean } = {}
): { valid: boolean; pages: number[]; error?: string } {
  if (maxPages <= 0) {
    return { valid: false, pages: [], error: 'Document has no selectable pages.' };
  }

  const trimmed = rangeSpec.trim();
  if (!trimmed) {
    return {
      valid: false,
      pages: [],
      error: 'Enter at least one page number or range (for example: 1, 2-4).',
    };
  }

  const parts = trimmed.split(',').map((p) => p.trim());
  const result: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (!part) {
      return {
        valid: false,
        pages: [],
        error: 'Invalid range syntax: empty segment detected.',
      };
    }

    const singleMatch = /^(\d+)$/.exec(part);
    if (singleMatch) {
      const pageNum = Number(singleMatch[1]);
      if (pageNum < 1 || pageNum > maxPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${pageNum} is outside the valid range (1 to ${maxPages}).`,
        };
      }
      const zeroIdx = pageNum - 1;
      if (options.allowDuplicates || !seen.has(zeroIdx)) {
        result.push(zeroIdx);
        seen.add(zeroIdx);
      }
      continue;
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < 1 || start > maxPages || end > maxPages) {
        return {
          valid: false,
          pages: [],
          error: `Range ${start}-${end} exceeds document page bounds (1 to ${maxPages}).`,
        };
      }
      if (start > end) {
        return {
          valid: false,
          pages: [],
          error: `Range ${start}-${end} has start page greater than end page.`,
        };
      }
      for (let p = start; p <= end; p++) {
        const zeroIdx = p - 1;
        if (options.allowDuplicates || !seen.has(zeroIdx)) {
          result.push(zeroIdx);
          seen.add(zeroIdx);
        }
      }
      continue;
    }

    return {
      valid: false,
      pages: [],
      error: `Invalid range token "${part}". Use 1-based numbers or ranges like 1, 3-5.`,
    };
  }

  if (result.length === 0) {
    return {
      valid: false,
      pages: [],
      error: 'No valid pages were selected.',
    };
  }

  return { valid: true, pages: result };
}

/**
 * FR-FILE-007:
 * Checks whether the current queue exceeds tested benchmark thresholds (150 MiB or 50 files).
 */
export function checkResourceThresholds(files: Array<{ sizeBytes: number }>): {
  exceedsThreshold: boolean;
  totalBytes: number;
  fileCount: number;
} {
  const totalBytes = files.reduce((acc, item) => acc + item.sizeBytes, 0);
  const fileCount = files.length;
  return {
    exceedsThreshold:
      totalBytes > BENCHMARK_MAX_BYTES || fileCount > BENCHMARK_MAX_FILES,
    totalBytes,
    fileCount,
  };
}
