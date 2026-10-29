# FlowPDF Browser Support Matrix

> Reference: PRD Section E5 (`NFR-COMP-001`) and `FR-GEN-010`.

| Browser | Supported Versions | Status | Notes |
|---|---|---|---|
| Chromium (Chrome, Edge, Brave) | Latest 2 stable desktop releases | Supported | Full support for `File.arrayBuffer()`, `HTMLCanvasElement`, `Blob`, and module Web Workers. |
| Mozilla Firefox | Latest 2 stable desktop releases | Supported | Full support for all 19 Available tools and keyboard-accessible workflows. |
| Apple Safari (macOS / iOS) | Latest stable release | Supported with Canvas Memory Limits | High-DPI batch rendering on mobile Safari is subject to iOS WebKit canvas memory caps; lazy single-page preview mitigates peak usage. |

## Required Browser Capabilities

- ES2022 JavaScript runtime
- `Blob`, `File`, `URL.createObjectURL`, `TextEncoder`, `TextDecoder`
- HTML5 2D `<canvas>` context (required for PDF page preview, `PDF to JPG`, and `PDF to PNG`)
- `Worker` (optional enhancement; `executeProcessingJob` automatically falls back to main-thread execution if Workers are restricted)
