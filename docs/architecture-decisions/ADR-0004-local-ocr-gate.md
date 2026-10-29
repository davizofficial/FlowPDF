# ADR-0004: Local OCR Engine and Language Data Gate (`CAT-OPT-003`, `CAT-AI-004`)

- **Status:** Proposed (Technical Gate Active)
- **Date:** 2026-10-29
- **Owner:** Engineering Lead

## Context

Client-side OCR (`CAT-OPT-003`) requires bundling WebAssembly OCR engines (such as Tesseract.js WASM) and self-hosted `.traineddata` language models without fetching models from third-party CDNs that could leak usage metadata (`C2.3`, `FR-OCR-006`).

## Decision

Keep `ocr-pdf` and `ocr-assisted-conversion` in the **`research`** state until self-hosted language pack sizing, Worker memory budgets on 8 GB RAM devices, and searchable text-layer alignment pass verification.
