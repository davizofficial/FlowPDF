# ADR-0002: PDF Manipulation and Rendering Engines (`pdf-lib` + Mozilla `pdfjs-dist`)

- **Status:** Accepted
- **Date:** 2026-10-29
- **Owner:** Engineering Lead

## Context

FlowPDF needs reliable client-side PDF structural manipulation (merge, split, organize, rotate, page numbers, watermark, crop, visual signature, metadata sanitization) and page rendering/text extraction (preview, PDF-to-JPG/PNG, PDF-to-Markdown/Text).

## Decision

- Use **`pdf-lib` (v1.17.1, MIT License)** behind typed `ProcessingAdapter` classes for structural PDF creation, page copying, image embedding, rotation, crop box modification, and metadata clearing.
- Use **Mozilla `pdfjs-dist` (v4.8.69, Apache-2.0 License)** for local page canvas rendering and text-stream extraction, configured with `isEvalSupported: false` and bundled worker assets.

## Consequences

- Source PDF pages are copied natively during merge/split/organize without destructive rasterization (`C5.1`).
- Every generated output PDF is re-parsed with `PDFDocument.load` (`verifyOutputArtifact`) before download is enabled (`FR-GEN-004`).
