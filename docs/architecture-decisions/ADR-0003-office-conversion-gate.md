# ADR-0003: Office Format Conversion Technical Gate (`CAT-IN-004..006`, `CAT-OUT-003..005`)

- **Status:** Proposed (Technical Gate Active)
- **Date:** 2026-10-29
- **Owner:** Engineering Lead

## Context

Converting DOCX, PPTX, and XLSX to/from PDF entirely inside a browser without a backend server (`LibreOffice` headless) faces severe layout, font-substitution, table-pagination, and chart-rendering fidelity limitations (`C3.5`, `RISK-004`).

## Decision

Keep `word-to-pdf`, `powerpoint-to-pdf`, `excel-to-pdf`, `pdf-to-word`, `pdf-to-powerpoint`, and `pdf-to-excel` in the **`research`** state in `src/registry/tools.ts`. They are hidden from default active tool navigation (`FR-GEN-001`) and documented in the Capability Matrix until a client-side WASM layout engine passes the fidelity benchmark corpus (`FR-CONVERT-002`).
