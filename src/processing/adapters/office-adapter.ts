import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
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
import { extractPdfTextByPage, renderPdfPageToImage } from './pdfjs-helper';
import { en } from '../../i18n/en';

export interface OfficeAdapterOptions {
  outputFilename?: string;
  convertAsImage?: boolean;
}

interface StructuredBlock {
  kind: 'h1' | 'h2' | 'bullet' | 'paragraph';
  text: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function escapeXml(str: string): string {
  return str
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSafeWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ');
}

function wrapTextLine(
  text: string,
  maxWidth: number,
  measureWidth: (s: string) => number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (measureWidth(candidate) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

async function renderStructuredBlocksToPdf(
  blocks: StructuredBlock[]
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 50;
  const maxLineWidth = pageW - margin * 2;

  let currentPage = pdfDoc.addPage([pageW, pageH]);
  let cursorY = pageH - margin;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < margin) {
      currentPage = pdfDoc.addPage([pageW, pageH]);
      cursorY = pageH - margin;
    }
  };

  const effectiveBlocks: StructuredBlock[] =
    blocks.length > 0
      ? blocks
      : [{ kind: 'paragraph', text: 'Document converted by FlowPDF.' }];

  for (const block of effectiveBlocks) {
    const safeText = toSafeWinAnsi(block.text).trim();
    if (!safeText) {
      cursorY -= 8;
      continue;
    }

    const isHeading1 = block.kind === 'h1';
    const isHeading2 = block.kind === 'h2';
    const isBullet = block.kind === 'bullet';

    const font = isHeading1 || isHeading2 ? fontBold : fontRegular;
    const fontSize = isHeading1 ? 18 : isHeading2 ? 14 : 11;
    const lineHeight = fontSize * 1.45;
    const prefix = isBullet ? '•  ' : '';
    const indent = isBullet ? 14 : 0;

    if (isHeading1 || isHeading2) {
      cursorY -= 6;
    }

    const wrapped = wrapTextLine(
      `${prefix}${safeText}`,
      maxLineWidth - indent,
      (s) => font.widthOfTextAtSize(s, fontSize)
    );

    for (let idx = 0; idx < wrapped.length; idx++) {
      ensureSpace(lineHeight);
      cursorY -= fontSize;
      currentPage.drawText(wrapped[idx], {
        x: margin + (idx > 0 ? indent : 0),
        y: cursorY,
        size: fontSize,
        font,
        color:
          isHeading1 || isHeading2
            ? rgb(0.11, 0.21, 0.36)
            : rgb(0.09, 0.12, 0.18),
      });
      cursorY -= lineHeight - fontSize;
    }

    cursorY -= 4;
  }

  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  return { bytes: outBytes, pageCount: pdfDoc.getPageCount() };
}

function parseDocxXmlToBlocks(xml: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];
  const paragraphMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];

  for (const pXml of paragraphMatches) {
    const styleMatch = pXml.match(/<w:pStyle\s+w:val="([^"]+)"/i);
    const styleVal = styleMatch ? styleMatch[1].toLowerCase() : '';
    const isList = /<w:numPr[\s>]/i.test(pXml);

    const textMatches = pXml.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
    const text = textMatches
      .map((tNode) => {
        const inner = tNode.replace(/^<w:t(?:\s+[^>]*)?>/, '').replace(/<\/w:t>$/, '');
        return decodeXmlEntities(inner);
      })
      .join('')
      .trim();

    if (!text) continue;

    if (styleVal.includes('heading1') || styleVal === 'title') {
      blocks.push({ kind: 'h1', text });
    } else if (styleVal.includes('heading2') || styleVal.includes('heading3') || styleVal.includes('subtitle')) {
      blocks.push({ kind: 'h2', text });
    } else if (isList || styleVal.includes('list')) {
      blocks.push({ kind: 'bullet', text });
    } else {
      blocks.push({ kind: 'paragraph', text });
    }
  }

  return blocks;
}

function parseHtmlToBlocks(html: string): StructuredBlock[] {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');

  const normalized = cleaned
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi, '\n## $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1\n')
    .replace(/<\/(p|div|tr|section|article|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  const lines = decodeXmlEntities(normalized).split(/\r?\n/);
  const blocks: StructuredBlock[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith('- ')) {
      blocks.push({ kind: 'bullet', text: trimmed.slice(2).trim() });
    } else {
      blocks.push({ kind: 'paragraph', text: trimmed });
    }
  }

  return blocks;
}

function parseExcelSharedStrings(xml: string): string[] {
  const siMatches = xml.match(/<si[\s>][\s\S]*?<\/si>/g) || [];
  return siMatches.map((si) => {
    const tMatches = si.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g) || [];
    return tMatches
      .map((t) => decodeXmlEntities(t.replace(/^<t(?:\s+[^>]*)?>/, '').replace(/<\/t>$/, '')))
      .join('');
  });
}

function parseWorksheetXml(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowMatches = xml.match(/<row[\s>][\s\S]*?<\/row>/g) || [];

  for (const rowXml of rowMatches) {
    const cellMatches = rowXml.match(/<c[\s>][\s\S]*?<\/c>/g) || [];
    const rowValues: string[] = [];

    for (const cXml of cellMatches) {
      const typeMatch = cXml.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : '';

      if (cellType === 'inlineStr') {
        const tMatch = cXml.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/);
        rowValues.push(tMatch ? decodeXmlEntities(tMatch[1]) : '');
      } else {
        const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);
        const rawVal = vMatch ? vMatch[1].trim() : '';
        if (cellType === 's') {
          const idx = Number.parseInt(rawVal, 10);
          rowValues.push(sharedStrings[idx] ?? rawVal);
        } else {
          rowValues.push(decodeXmlEntities(rawVal));
        }
      }
    }

    if (rowValues.some((v) => v.trim() !== '')) {
      rows.push(rowValues);
    }
  }

  return rows;
}

function buildDocxArchive(pageTexts: string[], docTitle: string): JSZip {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
</w:styles>`
  );

  const paragraphsXml: string[] = [
    `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(docTitle)}</w:t></w:r></w:p>`,
  ];

  pageTexts.forEach((pageText, idx) => {
    const lines = pageText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      paragraphsXml.push(
        `<w:p><w:r><w:t xml:space="preserve">[Page ${idx + 1}]</w:t></w:r></w:p>`
      );
    } else {
      for (const line of lines) {
        paragraphsXml.push(
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
        );
      }
    }

    if (idx < pageTexts.length - 1) {
      paragraphsXml.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
  });

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  return zip;
}

function columnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function buildXlsxArchive(
  rows: string[][],
  images: Array<{ name: string; bytes: Uint8Array }> = []
): JSZip {
  const zip = new JSZip();
  const hasImages = images.length > 0;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${hasImages ? '<Default Extension="png" ContentType="image/png"/>' : ''}
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  ${hasImages ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Extracted Data" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  );

  const effectiveRows =
    rows.length > 0 ? rows : [['Page', 'Content'], ['1', 'Extracted by FlowPDF']];

  const sheetRowsXml = effectiveRows
    .map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXml = cells
        .map((val, cIdx) => {
          const ref = `${columnLetter(cIdx)}${rowNum}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNum}">${cellsXml}</row>`;
    })
    .join('\n    ');

  if (hasImages) {
    images.forEach((img, i) => {
      zip.file(`xl/media/image${i + 1}.png`, img.bytes);
    });

    const drawingRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${images
    .map(
      (_, i) =>
        `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.png"/>`
    )
    .join('\n  ')}
</Relationships>`;
    zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRelsXml);

    const anchorsXml = images
      .map((_, i) => {
        const fromRow = 3 + i * 26;
        const toRow = fromRow + 24;
        return `<xdr:twoCellAnchor>
      <xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${fromRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
      <xdr:to><xdr:col>12</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
      <xdr:pic>
        <xdr:nvPicPr>
          <xdr:cNvPr id="${i + 2}" name="Page ${i + 1} Image"/>
          <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
        </xdr:nvPicPr>
        <xdr:blipFill>
          <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdImg${i + 1}"/>
          <a:stretch><a:fillRect/></a:stretch>
        </xdr:blipFill>
        <xdr:spPr>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </xdr:spPr>
      </xdr:pic>
      <xdr:clientData/>
    </xdr:twoCellAnchor>`;
      })
      .join('\n    ');

    const drawingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    ${anchorsXml}
</xdr:wsDr>`;
    zip.file('xl/drawings/drawing1.xml', drawingXml);

    zip.file(
      'xl/worksheets/_rels/sheet1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
    );
  }

  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
  ${hasImages ? '<drawing r:id="rIdDrawing1"/>' : ''}
</worksheet>`
  );

  return zip;
}

function buildPptxArchive(pageTexts: string[]): JSZip {
  const zip = new JSZip();
  const slides = pageTexts.length > 0 ? pageTexts : ['Slide 1'];

  const slideOverrides = slides
    .map(
      (_, i) =>
        `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${slideOverrides}
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const slideIdNodes = slides
    .map((_, i) => `    <p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`)
    .join('\n');

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
${slideIdNodes}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`
  );

  const relNodes = slides
    .map(
      (_, i) =>
        `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join('\n');

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relNodes}
</Relationships>`
  );

  slides.forEach((text, i) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const paragraphs = (lines.length > 0 ? lines : [`Slide ${i + 1}`])
      .map((line) => `<a:p><a:r><a:t>${escapeXml(line)}</a:t></a:r></a:p>`)
      .join('');

    zip.file(
      `ppt/slides/slide${i + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          ${paragraphs}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
    );
  });

  return zip;
}

export class OfficeAdapter implements ProcessingAdapter<OfficeAdapterOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<OfficeAdapterOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }
  }

  async run(
    input: ProcessingInput<OfficeAdapterOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    const file = input.files[0];
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const warnings: string[] = [];

    // 1. Word (.docx) to PDF
    if (this.toolId === 'word-to-pdf') {
      onProgress({
        stage: 'Processing document',
        message: 'Extracting paragraphs and headings from DOCX...',
      });

      const zip = await JSZip.loadAsync(inputBytes);
      const docXmlFile = zip.file('word/document.xml');
      if (!docXmlFile) {
        throw new Error('This file is not a valid DOCX document (missing word/document.xml).');
      }

      const docXml = await docXmlFile.async('string');
      const blocks = parseDocxXmlToBlocks(docXml);
      const { bytes: outBytes, pageCount } = await renderStructuredBlocksToPdf(blocks);

      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-from-word`,
        '.pdf'
      );
      const artifact: OutputArtifact = {
        name: outName,
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: pageCount,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    // 2. HTML to PDF
    if (this.toolId === 'html-to-pdf') {
      onProgress({
        stage: 'Processing document',
        message: 'Converting HTML content to paginated PDF...',
      });

      const htmlText = new TextDecoder('utf-8', { fatal: false }).decode(inputBytes);
      const blocks = parseHtmlToBlocks(htmlText);
      const { bytes: outBytes, pageCount } = await renderStructuredBlocksToPdf(blocks);

      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-from-html`,
        '.pdf'
      );
      const artifact: OutputArtifact = {
        name: outName,
        mimeType: 'application/pdf',
        bytes: outBytes,
        pageCount,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: pageCount,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    // 3. Excel (.xlsx / .csv) to PDF
    if (this.toolId === 'excel-to-pdf') {
      onProgress({
        stage: 'Processing document',
        message: 'Formatting spreadsheet rows into PDF tables...',
      });

      let rows: string[][] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const csvText = new TextDecoder('utf-8', { fatal: false }).decode(inputBytes);
        rows = csvText
          .split(/\r?\n/)
          .filter((l) => l.trim() !== '')
          .map((line) => line.split(',').map((c) => c.trim()));
      } else {
        const zip = await JSZip.loadAsync(inputBytes);
        const sharedFile = zip.file('xl/sharedStrings.xml');
        const sharedStrings = sharedFile
          ? parseExcelSharedStrings(await sharedFile.async('string'))
          : [];

        const sheetFiles = Object.keys(zip.files)
          .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
          .sort();

        if (sheetFiles.length === 0) {
          throw new Error('This file is not a valid XLSX workbook.');
        }

        for (const sheetPath of sheetFiles) {
          const sheetXml = await zip.file(sheetPath)!.async('string');
          rows.push(...parseWorksheetXml(sheetXml, sharedStrings));
        }
      }

      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageW = 841.89;
      const pageH = 595.28;
      const margin = 40;
      const rowHeight = 22;

      const effectiveRows =
        rows.length > 0 ? rows : [['Column 1', 'Column 2'], ['No data', '']];
      const maxCols = Math.min(
        8,
        Math.max(1, ...effectiveRows.map((r) => r.length))
      );
      const colWidth = (pageW - margin * 2) / maxCols;

      let page = pdfDoc.addPage([pageW, pageH]);
      let y = pageH - margin;

      effectiveRows.forEach((row, rIdx) => {
        if (y - rowHeight < margin) {
          page = pdfDoc.addPage([pageW, pageH]);
          y = pageH - margin;
        }

        const isHeader = rIdx === 0;
        page.drawRectangle({
          x: margin,
          y: y - rowHeight,
          width: pageW - margin * 2,
          height: rowHeight,
          color: isHeader
            ? rgb(0.11, 0.21, 0.36)
            : rIdx % 2 === 0
            ? rgb(0.96, 0.97, 0.99)
            : rgb(1, 1, 1),
          borderColor: rgb(0.85, 0.88, 0.92),
          borderWidth: 0.5,
        });

        for (let c = 0; c < maxCols; c++) {
          const cellText = toSafeWinAnsi(row[c] ?? '').trim().slice(0, 28);
          page.drawText(cellText, {
            x: margin + c * colWidth + 6,
            y: y - rowHeight + 6,
            size: 9.5,
            font: isHeader ? fontBold : fontRegular,
            color: isHeader ? rgb(1, 1, 1) : rgb(0.09, 0.12, 0.18),
          });
        }

        y -= rowHeight;
      });

      const outBytes = await pdfDoc.save({ useObjectStreams: true });
      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-from-excel`,
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
          totalOutputPages: pdfDoc.getPageCount(),
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    // 4. PowerPoint (.pptx) to PDF
    if (this.toolId === 'powerpoint-to-pdf') {
      onProgress({
        stage: 'Processing document',
        message: 'Converting PowerPoint slides to landscape PDF...',
      });

      const zip = await JSZip.loadAsync(inputBytes);
      const slidePaths = Object.keys(zip.files)
        .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
        .sort((a, b) => {
          const numA = Number.parseInt(a.match(/\d+/)?.[0] || '0', 10);
          const numB = Number.parseInt(b.match(/\d+/)?.[0] || '0', 10);
          return numA - numB;
        });

      if (slidePaths.length === 0) {
        throw new Error('This file is not a valid PPTX presentation.');
      }

      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const slideW = 841.89;
      const slideH = 595.28;

      for (let i = 0; i < slidePaths.length; i++) {
        const slideXml = await zip.file(slidePaths[i])!.async('string');
        const pMatches = slideXml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
        const slideLines: string[] = [];

        for (const pNode of pMatches) {
          const tMatches = pNode.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
          const text = tMatches
            .map((t) => decodeXmlEntities(t.replace(/^<a:t>/, '').replace(/<\/a:t>$/, '')))
            .join('')
            .trim();
          if (text) slideLines.push(text);
        }

        const page = pdfDoc.addPage([slideW, slideH]);
        // Top Navy Header Bar
        page.drawRectangle({
          x: 0,
          y: slideH - 64,
          width: slideW,
          height: 64,
          color: rgb(0.11, 0.21, 0.36),
        });

        const titleText = toSafeWinAnsi(slideLines[0] || `Slide ${i + 1}`).slice(0, 70);
        page.drawText(titleText, {
          x: 48,
          y: slideH - 42,
          size: 20,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        let cursorY = slideH - 110;
        for (let b = 1; b < slideLines.length; b++) {
          if (cursorY < 56) break;
          const bulletLine = `•  ${toSafeWinAnsi(slideLines[b])}`.slice(0, 95);
          page.drawText(bulletLine, {
            x: 56,
            y: cursorY,
            size: 13,
            font: fontRegular,
            color: rgb(0.12, 0.16, 0.23),
          });
          cursorY -= 26;
        }

        page.drawText(`Slide ${i + 1} of ${slidePaths.length}`, {
          x: slideW - 120,
          y: 28,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.45, 0.5, 0.58),
        });
      }

      const outBytes = await pdfDoc.save({ useObjectStreams: true });
      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-from-pptx`,
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
          totalOutputPages: pdfDoc.getPageCount(),
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: outBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    // 5. PDF to Office (Word .docx, Excel .xlsx, PowerPoint .pptx)
    const pdfDoc = await PDFDocument.load(inputBytes, { updateMetadata: false });
    const totalPages = pdfDoc.getPageCount();
    onProgress({
      stage: 'Processing document',
      message: `Extracting text from ${totalPages} page(s)...`,
    });

    let pageTexts: string[] = [];
    try {
      const extracted = await extractPdfTextByPage(inputBytes);
      pageTexts = extracted.map((item, idx) => item.text.trim() || `Page ${idx + 1}`);
    } catch {
      pageTexts = Array.from({ length: totalPages }, (_, idx) => `Page ${idx + 1}`);
    }

    if (this.toolId === 'pdf-to-word') {
      const zip = buildDocxArchive(pageTexts, baseName);
      const docxBytes = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });

      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-editable`,
        '.docx'
      );
      const artifact: OutputArtifact = {
        name: outName,
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bytes: docxBytes,
        pageCount: totalPages,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: totalPages,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: docxBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'pdf-to-excel') {
      const isConvertAsImageRequested = Boolean(input.options.convertAsImage);
      const totalExtractedText = pageTexts.reduce(
        (acc, pText) => acc + pText.replace(/[\s\r\n\t]/g, '').length,
        0
      );
      const isScannedDoc = totalExtractedText < 20;

      let sheetRows: string[][] = [];
      const images: Array<{ name: string; bytes: Uint8Array }> = [];

      if (isConvertAsImageRequested || isScannedDoc) {
        warnings.push(
          'Scanned document converted as an image into a non-editable Excel file. OCR is required to extract editable cells.'
        );
        sheetRows = [
          ['Page', 'Document Type', 'Status', 'Notice'],
        ];

        for (let p = 1; p <= totalPages; p++) {
          try {
            const rendered = await renderPdfPageToImage(inputBytes, p, {
              format: 'image/png',
              scale: 1.0,
            });
            if (rendered.bytes && rendered.bytes.byteLength > 0) {
              images.push({
                name: `image${p}.png`,
                bytes: rendered.bytes,
              });
            }
          } catch {
            // Keep fallback
          }
          sheetRows.push([
            `Page ${p}`,
            'Scanned PDF Page',
            'Converted as Image (Non-editable)',
            'To extract content of scanned documents, OCR is required.',
          ]);
        }
      } else {
        sheetRows = [['Page', 'Column 1', 'Column 2', 'Column 3']];
        pageTexts.forEach((pText, idx) => {
          const lines = pText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          for (const line of lines) {
            const cols = line.split(/\t|\s{2,}/).map((c) => c.trim());
            sheetRows.push([String(idx + 1), ...cols]);
          }
        });
      }

      const zip = buildXlsxArchive(sheetRows, images);
      const xlsxBytes = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });

      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-spreadsheet`,
        '.xlsx'
      );
      const artifact: OutputArtifact = {
        name: outName,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        bytes: xlsxBytes,
        pageCount: totalPages,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: totalPages,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: xlsxBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'pdf-to-powerpoint') {
      const zip = buildPptxArchive(pageTexts);
      const pptxBytes = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });

      const outName = sanitizeFilename(
        input.options.outputFilename || `${baseName}-slides`,
        '.pptx'
      );
      const artifact: OutputArtifact = {
        name: outName,
        mimeType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        bytes: pptxBytes,
        pageCount: totalPages,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }

      return {
        outputs: [artifact],
        warnings,
        metadata: {
          totalOutputPages: totalPages,
          inputBytesTotal: inputBytes.byteLength,
          outputBytesTotal: pptxBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    throw new Error(`Unsupported Office conversion tool: ${this.toolId}`);
  }
}
