# ADR-0007: Local AI Inference and Zero-Cloud-API Invariant (`CAT-AI-001..004`)

- **Status:** Accepted (Gated)
- **Date:** 2026-10-29
- **Owner:** Engineering Lead & Privacy Reviewer

## Context

Per PRD Section C3.6 and `FR-AI-001..006`, FlowPDF MUST NOT send PDF text, prompts containing document content, or page images to hosted AI APIs in default mode.

## Decision

Mark `ai-summarizer` and `pdf-translation` as **`blocked`** and `ask-pdf` / `ocr-assisted-conversion` as **`research`** in `src/registry/tools.ts` until a WebGPU/WASM local inference model passes download-size, 8 GB RAM memory budget, license, and hallucination grounding gates. Silent fallback to remote LLM APIs is strictly prohibited.
