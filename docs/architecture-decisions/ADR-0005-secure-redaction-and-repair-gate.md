# ADR-0005: Irreversible Redaction and PDF Repair Gate (`CAT-SEC-005`, `CAT-OPT-002`)

- **Status:** Accepted (Release Blocked Until Verification Passes)
- **Date:** 2026-10-29
- **Owner:** Security & Privacy Reviewer

## Context

Per PRD Section C5.4 and `FR-SEC-005`, drawing a black rectangle over text is **prohibited** as a redaction implementation because underlying text, fonts, and overlapping XObjects remain recoverable via copy/paste or stream inspection (`RISK-006`).

## Decision

Mark `redact-pdf` as **`blocked`** in `src/registry/tools.ts` until a verified content-stream parser or explicit full-page irreversible rasterization workflow passes automated extraction non-recoverability tests. Additionally, `crop-pdf` (`CAT-EDIT-004`) explicitly warns users before and after execution that adjusting CropBox/TrimBox boundaries is **not** redaction.
