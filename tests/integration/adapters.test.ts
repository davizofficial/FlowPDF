import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { MergeAndImageAdapter } from '../../src/processing/adapters/merge-and-image-adapter';
import { PagesAdapter } from '../../src/processing/adapters/pages-adapter';
import { CompressPdfAdapter } from '../../src/processing/adapters/compress-adapter';
import { EditPdfAdapter } from '../../src/processing/adapters/edit-adapter';
import { SecurityAdapter } from '../../src/processing/adapters/security-adapter';
import { ConvertAdapter } from '../../src/processing/adapters/convert-adapter';
import { OfficeAdapter } from '../../src/processing/adapters/office-adapter';
import {
  serializeWorkflowTemplate,
  WorkflowAdapter,
} from '../../src/processing/adapters/workflow-adapter';

async function createSamplePdfFile(
  name: string,
  pageCount: number,
  options: { title?: string; author?: string; useObjectStreams?: boolean } = {}
): Promise<{ file: File; bytes: Uint8Array }> {
  const doc = await PDFDocument.create();
  if (options.title) doc.setTitle(options.title);
  if (options.author) doc.setAuthor(options.author);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`${name} - Page ${i}`, { x: 50, y: 750, size: 14, font });
  }

  const bytes = await doc.save({
    useObjectStreams: options.useObjectStreams ?? false,
  });
  return {
    file: new File([bytes], name, { type: 'application/pdf' }),
    bytes,
  };
}

function createSamplePngFile(name = 'pixel.png'): File {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const bin = atob(pngBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: 'image/png' });
}

function createSampleJpgFile(name = 'pixel.jpg'): File {
  const jpgHex =
    'ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffda0008010100003f00fbfd28a2803fffd9';
  const bytes = new Uint8Array(jpgHex.length / 2);
  for (let i = 0; i < jpgHex.length; i += 2) {
    bytes[i / 2] = parseInt(jpgHex.slice(i, i + 2), 16);
  }
  return new File([bytes], name, { type: 'image/jpeg' });
}

describe('Integration: Document Processing Adapters', () => {
  it('merges mixed PDF, JPG, and PNG inputs in exact order while keeping source bytes intact (KPI-01, KPI-02, KPI-03)', async () => {
    const pdf1 = await createSamplePdfFile('first.pdf', 2);
    const png = createSamplePngFile('middle.png');
    const jpg = createSampleJpgFile('photo.jpg');
    const pdf2 = await createSamplePdfFile('last.pdf', 3);

    const origPdf1Bytes = new Uint8Array(await pdf1.file.arrayBuffer());

    const adapter = new MergeAndImageAdapter('merge-pdf');
    const result = await adapter.run(
      {
        jobId: 'merge-test-1',
        files: [pdf1.file, png, jpg, pdf2.file],
        options: {
          outputFilename: 'combined-pack',
          pageSize: 'A4',
          marginMm: 10,
        },
      },
      () => {}
    );

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].name).toBe('combined-pack.pdf');
    // 2 PDF pages + 1 PNG page + 1 JPG page + 3 PDF pages = 7 pages
    expect(result.metadata.totalOutputPages).toBe(7);

    // Verify source file bytes were not mutated (FR-FILE-008)
    const afterPdf1Bytes = new Uint8Array(await pdf1.file.arrayBuffer());
    expect(afterPdf1Bytes).toEqual(origPdf1Bytes);
  });

  it('splits, organizes, removes, extracts, and copies PDFs accurately (FR-PAGES)', async () => {
    const { file } = await createSamplePdfFile('source-4p.pdf', 4);

    // 1. Split by ranges -> produces individual files + ZIP bundle
    const splitAdapter = new PagesAdapter('split-pdf');
    const splitRes = await splitAdapter.run(
      {
        jobId: 'split-1',
        files: [file],
        options: {
          splitMode: 'ranges',
          rangeSpec: '1-2, 3-4',
          packageAsZip: true,
        },
      },
      () => {}
    );
    expect(splitRes.outputs[0].mimeType).toBe('application/zip');
    expect(splitRes.outputs).toHaveLength(3); // 1 ZIP + 2 split PDFs

    // 2. Organize PDF (reorder + rotate)
    const orgAdapter = new PagesAdapter('organize-pdf');
    const orgRes = await orgAdapter.run(
      {
        jobId: 'org-1',
        files: [file],
        options: {
          pageSequence: [
            { originalPageIndex: 3, rotationDelta: 90 },
            { originalPageIndex: 0, rotationDelta: 0 },
          ],
        },
      },
      () => {}
    );
    expect(orgRes.metadata.totalOutputPages).toBe(2);
    const reloadedOrg = await PDFDocument.load(orgRes.outputs[0].bytes);
    expect(reloadedOrg.getPage(0).getRotation().angle).toBe(90);

    // 3. Remove Pages (disallows removing all pages)
    const remAdapter = new PagesAdapter('remove-pages');
    await expect(
      remAdapter.run(
        {
          jobId: 'rem-all',
          files: [file],
          options: { targetPagesSpec: '1-4' },
        },
        () => {}
      )
    ).rejects.toThrow(/empty \(0-page\) document/);

    const remValid = await remAdapter.run(
      {
        jobId: 'rem-valid',
        files: [file],
        options: { targetPagesSpec: '2-3' },
      },
      () => {}
    );
    expect(remValid.metadata.totalOutputPages).toBe(2);

    // 4. Extract Pages
    const extAdapter = new PagesAdapter('extract-pages');
    const extRes = await extAdapter.run(
      {
        jobId: 'ext-1',
        files: [file],
        options: { targetPagesSpec: '4, 1' },
      },
      () => {}
    );
    expect(extRes.metadata.totalOutputPages).toBe(2);

    // 5. Copy PDF (exact bytes)
    const copyAdapter = new PagesAdapter('copy-pdf');
    const copyRes = await copyAdapter.run(
      {
        jobId: 'copy-1',
        files: [file],
        options: { copyMode: 'exact-bytes' },
      },
      () => {}
    );
    expect(copyRes.outputs[0].bytes.byteLength).toBe(file.size);
  });

  it('compresses unoptimized PDFs and retains baseline when already compact (FR-COMPRESS)', async () => {
    const unoptimized = await createSamplePdfFile('verbose.pdf', 5, {
      title: 'Verbose Metadata Title '.repeat(20),
      author: 'Verbose Author '.repeat(20),
      useObjectStreams: false,
    });

    const compressAdapter = new CompressPdfAdapter();
    const res1 = await compressAdapter.run(
      {
        jobId: 'comp-1',
        files: [unoptimized.file],
        options: { profile: 'high-quality' },
      },
      () => {}
    );

    expect(res1.outputs).toHaveLength(1);
    expect(res1.outputs[0].bytes.byteLength).toBeLessThanOrEqual(
      unoptimized.bytes.byteLength
    );

    // Now test no-recompression baseline mode
    const resBaseline = await compressAdapter.run(
      {
        jobId: 'comp-baseline',
        files: [unoptimized.file],
        options: { profile: 'no-recompression' },
      },
      () => {}
    );
    expect(resBaseline.metadata.compressionReport?.retainedBaseline).toBe(true);
    expect(resBaseline.outputs[0].bytes.byteLength).toBe(
      unoptimized.bytes.byteLength
    );
  });

  it('applies rotation, page numbers, watermarks, and crop boxes (FR-EDIT)', async () => {
    const { file } = await createSamplePdfFile('edit-target.pdf', 3);

    const rotateAdapter = new EditPdfAdapter('rotate-pdf');
    const rotRes = await rotateAdapter.run(
      {
        jobId: 'rot-1',
        files: [file],
        options: { rotationDegrees: 180, pageRangeSpec: '1-2' },
      },
      () => {}
    );
    const rotDoc = await PDFDocument.load(rotRes.outputs[0].bytes);
    expect(rotDoc.getPage(0).getRotation().angle).toBe(180);
    expect(rotDoc.getPage(2).getRotation().angle).toBe(0);

    const numAdapter = new EditPdfAdapter('add-page-numbers');
    const numRes = await numAdapter.run(
      {
        jobId: 'num-1',
        files: [file],
        options: {
          pageNumberPosition: 'bottom-right',
          pageNumberFormat: 'page-n-of-total',
        },
      },
      () => {}
    );
    expect(numRes.metadata.totalOutputPages).toBe(3);

    const wmAdapter = new EditPdfAdapter('add-watermark');
    const wmRes = await wmAdapter.run(
      {
        jobId: 'wm-1',
        files: [file],
        options: { watermarkText: 'DRAFT COPY', watermarkOpacity: 0.25 },
      },
      () => {}
    );
    expect(wmRes.metadata.totalOutputPages).toBe(3);

    const cropAdapter = new EditPdfAdapter('crop-pdf');
    const cropRes = await cropAdapter.run(
      {
        jobId: 'crop-1',
        files: [file],
        options: { cropTopMm: 10, cropBottomMm: 10, cropLeftMm: 10, cropRightMm: 10 },
      },
      () => {}
    );
    expect(cropRes.warnings.join(' ')).toContain('not a substitute for secure redaction');
  });

  it('sanitizes metadata and clears standard document info fields (FR-SEC)', async () => {
    const { file } = await createSamplePdfFile('confidential.pdf', 2, {
      title: 'Secret Project Name',
      author: 'Jane Doe',
    });

    const sanitizeAdapter = new SecurityAdapter('sanitize-metadata');
    const sanRes = await sanitizeAdapter.run(
      {
        jobId: 'san-1',
        files: [file],
        options: {},
      },
      () => {}
    );
    expect(sanRes.warnings.join(' ')).toContain('clears standard document metadata');
    const cleanedDoc = await PDFDocument.load(sanRes.outputs[0].bytes);
    expect(cleanedDoc.getTitle() ?? '').toBe('');
    expect(cleanedDoc.getAuthor() ?? '').toBe('');
  });

  it('converts Markdown to PDF while sanitizing unsafe HTML tags (FR-CONVERT, NFR-SEC-002)', async () => {
    const mdSource = [
      '# Security Review Notes',
      '<script>alert("xss")</script>',
      'Paragraph with **bold** and `inline code`.',
      '- Bullet one',
      '- Bullet two',
    ].join('\n');

    const mdFile = new File([mdSource], 'notes.md', { type: 'text/markdown' });
    const convAdapter = new ConvertAdapter('markdown-to-pdf');
    const res = await convAdapter.run(
      {
        jobId: 'md-1',
        files: [mdFile],
        options: { outputFilename: 'clean-notes' },
      },
      () => {}
    );

    expect(res.outputs[0].name).toBe('clean-notes.pdf');
    expect(res.warnings.join(' ')).toContain('Raw HTML tags');
    expect(res.metadata.totalOutputPages).toBeGreaterThanOrEqual(1);
  });

  it('chains steps in Workflow Builder and isolates per-file errors in Batch Processing (FR-WF)', async () => {
    const { file } = await createSamplePdfFile('workflow-doc.pdf', 2, {
      title: 'Original Title',
    });

    const wfAdapter = new WorkflowAdapter('workflow-builder');
    const steps = [
      { id: 's1', toolId: 'sanitize-metadata' as const, options: {} },
      { id: 's2', toolId: 'rotate-pdf' as const, options: { rotationDegrees: 90 } },
      {
        id: 's3',
        toolId: 'add-page-numbers' as const,
        options: { pageNumberPosition: 'bottom-center' },
      },
    ];

    const wfRes = await wfAdapter.run(
      {
        jobId: 'wf-1',
        files: [file],
        options: { steps },
      },
      () => {}
    );

    expect(wfRes.outputs).toHaveLength(1);
    const outDoc = await PDFDocument.load(wfRes.outputs[0].bytes);
    expect(outDoc.getPage(0).getRotation().angle).toBe(90);

    // Ensure serialized workflow config never leaks filenames or secrets (FR-WF-003)
    const serialized = serializeWorkflowTemplate([
      {
        id: 's1',
        toolId: 'rotate-pdf',
        options: {
          rotationDegrees: 90,
          outputFilename: 'secret-name.pdf',
          password: 'should-not-serialize',
        },
      },
    ]);
    expect(serialized).not.toContain('secret-name.pdf');
    expect(serialized).not.toContain('should-not-serialize');

    // Batch processing with one valid PDF and one corrupt PDF
    const corruptFile = new File([new Uint8Array([1, 2, 3, 4])], 'corrupt.pdf', {
      type: 'application/pdf',
    });
    const batchAdapter = new WorkflowAdapter('batch-processing');
    const batchRes = await batchAdapter.run(
      {
        jobId: 'batch-1',
        files: [file, corruptFile],
        options: {
          batchToolId: 'rotate-pdf',
          batchToolOptions: { rotationDegrees: 90 },
        },
      },
      () => {}
    );

    expect(batchRes.outputs).toHaveLength(1);
    expect(batchRes.warnings.some((w) => w.includes('corrupt.pdf'))).toBe(true);
  });

  it('converts between PDF and Word (DOCX), Excel (XLSX), PowerPoint (PPTX), HTML, and runs Insert/Replace & Compare PDF', async () => {
    const { file: pdf1 } = await createSamplePdfFile('source-a.pdf', 2);
    const { file: pdf2 } = await createSamplePdfFile('source-b.pdf', 1);

    // 1. PDF -> Word (.docx) -> PDF
    const pdfToWord = new OfficeAdapter('pdf-to-word');
    const docxRes = await pdfToWord.run(
      { jobId: 'p2w', files: [pdf1], options: {} },
      () => {}
    );
    expect(docxRes.outputs[0].name).toMatch(/\.docx$/);

    const docxFile = new File([docxRes.outputs[0].bytes], 'generated.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const wordToPdf = new OfficeAdapter('word-to-pdf');
    const wordPdfRes = await wordToPdf.run(
      { jobId: 'w2p', files: [docxFile], options: {} },
      () => {}
    );
    expect(wordPdfRes.outputs[0].name).toMatch(/\.pdf$/);
    expect(wordPdfRes.metadata.totalOutputPages).toBeGreaterThanOrEqual(1);

    // 2. PDF -> Excel (.xlsx) -> PDF
    const pdfToExcel = new OfficeAdapter('pdf-to-excel');
    const xlsxRes = await pdfToExcel.run(
      { jobId: 'p2x', files: [pdf1], options: {} },
      () => {}
    );
    expect(xlsxRes.outputs[0].name).toMatch(/\.xlsx$/);

    const xlsxFile = new File([xlsxRes.outputs[0].bytes], 'generated.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const excelToPdf = new OfficeAdapter('excel-to-pdf');
    const excelPdfRes = await excelToPdf.run(
      { jobId: 'x2p', files: [xlsxFile], options: {} },
      () => {}
    );
    expect(excelPdfRes.outputs[0].name).toMatch(/\.pdf$/);

    // 2b. PDF -> Excel (.xlsx) with convertAsImage mode (Scanned PDF)
    const scanExcelRes = await pdfToExcel.run(
      { jobId: 'p2x-img', files: [pdf1], options: { convertAsImage: true } },
      () => {}
    );
    expect(scanExcelRes.outputs[0].name).toMatch(/\.xlsx$/);
    expect(scanExcelRes.warnings.join(' ')).toContain('Scanned document converted as an image');

    // 3. PDF -> PowerPoint (.pptx) -> PDF
    const pdfToPptx = new OfficeAdapter('pdf-to-powerpoint');
    const pptxRes = await pdfToPptx.run(
      { jobId: 'p2p', files: [pdf1], options: {} },
      () => {}
    );
    expect(pptxRes.outputs[0].name).toMatch(/\.pptx$/);

    const pptxFile = new File([pptxRes.outputs[0].bytes], 'generated.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const pptxToPdf = new OfficeAdapter('powerpoint-to-pdf');
    const pptxPdfRes = await pptxToPdf.run(
      { jobId: 'ppt2p', files: [pptxFile], options: {} },
      () => {}
    );
    expect(pptxPdfRes.outputs[0].name).toMatch(/\.pdf$/);

    // 4. HTML -> PDF
    const htmlFile = new File(
      [new TextEncoder().encode('<h1>Quarterly Report</h1><p>Confidential summary.</p>')],
      'report.html',
      { type: 'text/html' }
    );
    const htmlToPdf = new OfficeAdapter('html-to-pdf');
    const htmlRes = await htmlToPdf.run(
      { jobId: 'h2p', files: [htmlFile], options: {} },
      () => {}
    );
    expect(htmlRes.outputs[0].name).toMatch(/\.pdf$/);

    // 5. Insert / Replace Pages
    const insertAdapter = new PagesAdapter('insert-replace-pages');
    const insertRes = await insertAdapter.run(
      {
        jobId: 'ins-1',
        files: [pdf1, pdf2],
        options: { insertReplaceMode: 'insert', insertAfterPage: 1 },
      },
      () => {}
    );
    expect(insertRes.metadata.totalOutputPages).toBe(3);

    // 6. Compare PDF
    const compareAdapter = new SecurityAdapter('compare-pdf');
    const compareRes = await compareAdapter.run(
      {
        jobId: 'cmp-1',
        files: [pdf1, pdf2],
        options: {},
      },
      () => {}
    );
    expect(compareRes.outputs[0].name).toMatch(/\.pdf$/);
  });
});
