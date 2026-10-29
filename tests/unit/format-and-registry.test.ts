import { describe, expect, it } from 'vitest';
import {
  BENCHMARK_MAX_BYTES,
  calculateCompressionReport,
  checkResourceThresholds,
  deconflictBatchFilenames,
  formatBytes,
  parsePageRanges,
  sanitizeFilename,
} from '../../src/lib/format';
import {
  getAvailableToolById,
  getAvailableTools,
  getToolById,
  TOOL_REGISTRY,
} from '../../src/registry/tools';

describe('Unit: Formatting, Range Parsing, Compression Math & Tool Registry', () => {
  it('formats byte sizes accurately (formatBytes)', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-50)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.00 KiB');
    expect(formatBytes(1048576)).toBe('1.00 MiB');
  });

  it('calculates exact compression savings and enforces baseline fallback (KPI-05, KPI-06)', () => {
    // Case 1: Genuine size reduction
    const smaller = calculateCompressionReport(100_000, 65_000, 'high-quality', true);
    expect(smaller.retainedBaseline).toBe(false);
    expect(smaller.savedBytes).toBe(35_000);
    expect(smaller.savingsPercent).toBe(35);
    expect(smaller.outputBytes).toBe(65_000);

    // Case 2: Larger output -> retains baseline
    const larger = calculateCompressionReport(100_000, 112_000, 'balanced', true);
    expect(larger.retainedBaseline).toBe(true);
    expect(larger.savedBytes).toBe(0);
    expect(larger.savingsPercent).toBe(0);
    expect(larger.outputBytes).toBe(100_000);
    expect(larger.reason).toContain('The compressed output is larger');

    // Case 3: Equal size -> retains baseline
    const equal = calculateCompressionReport(50_000, 50_000, 'high-quality', true);
    expect(equal.retainedBaseline).toBe(true);
    expect(equal.outputBytes).toBe(50_000);

    // Case 4: Invalid candidate -> retains baseline
    const invalid = calculateCompressionReport(80_000, 20_000, 'smallest-file', false);
    expect(invalid.retainedBaseline).toBe(true);
    expect(invalid.outputBytes).toBe(80_000);
  });

  it('sanitizes filenames and prevents path traversal or reserved names (C4.3, FR-FILE-010)', () => {
    expect(sanitizeFilename('../../etc/passwd', '.pdf')).toBe('passwd.pdf');
    expect(sanitizeFilename('report:draft*2026?.pdf', '.pdf')).toBe(
      'report-draft-2026.pdf'
    );
    expect(sanitizeFilename('CON', '.pdf')).toBe('flowpdf-con.pdf');
    expect(sanitizeFilename('   ', '.pdf')).toBe('flowpdf-output.pdf');
  });

  it('deconflicts duplicate filenames deterministically in batch/ZIP mode (FR-WF-006)', () => {
    const input = ['invoice.pdf', 'invoice.pdf', 'INVOICE.PDF', 'summary.pdf'];
    expect(deconflictBatchFilenames(input)).toEqual([
      'invoice.pdf',
      'invoice-2.pdf',
      'INVOICE-3.PDF',
      'summary.pdf',
    ]);
  });

  it('validates 1-based page ranges and converts to 0-based indices (FR-PAGES-002, FR-PAGES-004)', () => {
    const valid = parsePageRanges('1, 3-5, 2', 6);
    expect(valid.valid).toBe(true);
    expect(valid.pages).toEqual([0, 2, 3, 4, 1]);

    const outOfBounds = parsePageRanges('1, 7', 6);
    expect(outOfBounds.valid).toBe(false);
    expect(outOfBounds.error).toContain('outside the valid range');

    const reversed = parsePageRanges('5-2', 6);
    expect(reversed.valid).toBe(false);
    expect(reversed.error).toContain('greater than end page');

    const empty = parsePageRanges('   ', 6);
    expect(empty.valid).toBe(false);
  });

  it('flags batches exceeding 150 MiB or 50 files (FR-FILE-007)', () => {
    const smallBatch = checkResourceThresholds([
      { sizeBytes: 1024 * 1024 },
      { sizeBytes: 2 * 1024 * 1024 },
    ]);
    expect(smallBatch.exceedsThreshold).toBe(false);

    const hugeSize = checkResourceThresholds([
      { sizeBytes: BENCHMARK_MAX_BYTES + 100 },
    ]);
    expect(hugeSize.exceedsThreshold).toBe(true);

    const manyFiles = checkResourceThresholds(
      Array.from({ length: 51 }, () => ({ sizeBytes: 1024 }))
    );
    expect(manyFiles.exceedsThreshold).toBe(true);
  });

  it('enforces central tool registry uniqueness and status gating (FR-GEN-001, KPI-11)', () => {
    const ids = new Set<string>();
    const catIds = new Set<string>();

    for (const tool of TOOL_REGISTRY) {
      expect(ids.has(tool.id)).toBe(false);
      expect(catIds.has(tool.catalogueId)).toBe(false);
      ids.add(tool.id);
      catIds.add(tool.catalogueId);
    }

    const available = getAvailableTools();
    expect(available.length).toBeGreaterThanOrEqual(18);
    expect(getAvailableToolById('merge-pdf')).toBeDefined();
    // Redact PDF is blocked by technical gate and must NOT be returned as available
    expect(getToolById('redact-pdf')?.status).toBe('blocked');
    expect(getAvailableToolById('redact-pdf')).toBeUndefined();
  });
});
