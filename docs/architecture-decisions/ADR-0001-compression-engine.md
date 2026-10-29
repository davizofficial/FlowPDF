# ADR-0001: Select Browser-Side PDF Compression Strategy and Baseline Fallback

- **Status:** Accepted
- **Date:** 2026-10-29
- **Owner:** Engineering Lead

## Context

FlowPDF requires client-side PDF compression (`CAT-OPT-001`, `FR-COMPRESS-001..008`) without uploading files to a remote server and without violating open-source distribution licenses on Vercel static hosting.

## Decision Drivers

1. **Zero network egress:** Document bytes must remain inside the browser session (`NFR-PRIV-001`).
2. **Permissive licensing:** Ghostscript WASM binaries are governed by AGPLv3, which imposes strict copyleft and source-disclosure obligations that conflict with standard permissive static deployments unless separately approved (`RISK-002`).
3. **Quality over arbitrary compression ratio:** Output must be structurally verified (`verifyOutputArtifact`) and compared byte-for-byte against the original input (`KPI-05`, `KPI-06`).

## Options Considered

1. **Ghostscript WASM (`@jspawn/ghostscript-wasm`):** Powerful PDF/PostScript interpreter, but AGPLv3 licensed and multi-megabyte binary payload.
2. **Two-tier `pdf-lib` Object-Stream Compaction + PDF.js Canvas JPEG Re-encoding:**
   - **High Quality profile:** Rewrites the PDF into compressed PDF 1.5+ object streams (`useObjectStreams: true`) and removes unreferenced objects and metadata bloat while preserving 100% of selectable text and vector graphics.
   - **Balanced / Smallest File profiles:** Uses local PDF.js page rasterization and controlled JPEG re-encoding for image/scan-heavy documents when that yields a smaller byte size, accompanied by an explicit rasterization warning.
   - **Automatic Baseline Fallback:** If any candidate output is larger than or equal to the input byte size, or fails independent parser verification, FlowPDF automatically retains the original valid baseline (`FR-COMPRESS-005`).

## Decision

Adopt Option 2 (Two-tier MIT/Apache-2.0 client-side compression with mandatory baseline fallback). Ghostscript WASM is deferred unless commercial/AGPLv3 compliance is separately approved.

## Consequences

- 100% MIT/Apache-2.0 license compatibility.
- Honest byte-level reporting (`calculateCompressionReport`) and guaranteed non-degradation of file size.
