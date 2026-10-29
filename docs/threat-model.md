# FlowPDF Threat Model & Security Controls

> Aligned with PRD Section C8.3 (OWASP ASVS 5.0.0 client-side profile) and Section E5 (`NFR-SEC-001..005`).

## 1. Trust Boundaries

- **Browser Local Execution Boundary:** All user files, ArrayBuffers, rendered canvas bitmaps, and output Blobs remain inside the user's browser process.
- **Static Asset Origin (Vercel):** Serves immutable HTML, CSS, JS, and self-hosted icons/workers. Receives **zero** POST/PUT requests or query parameters containing document data.
- **Untrusted Input Files:** Every selected PDF, JPG, PNG, or Markdown file is treated as untrusted input (`NFR-SEC-001`).

## 2. Identified Threats & Mitigations

| Threat ID | Threat Description | Mitigation Implemented |
|---|---|---|
| TM-01 | Accidental or third-party exfiltration of document contents over the network | Zero analytics/telemetry SDKs installed; strict CSP in `vercel.json` (`connect-src 'self' blob: data:; form-action 'none'`); automated Vitest spy assertions (`tests/privacy/network-and-storage.test.ts`). |
| TM-02 | Persistent residual data in `localStorage`, `sessionStorage`, or `IndexedDB` | FlowPDF never writes file contents, filenames, or extracted text to Web Storage APIs (`NFR-PRIV-002`). Temporary Blob download URLs are revoked after download (`triggerArtifactDownload`). |
| TM-03 | Cross-Site Scripting (XSS) via malicious Markdown or PDF metadata strings | React escapes text nodes by default; `sanitizeMarkdownHtml` strips `<script>`, `<iframe>`, and raw HTML tags before rendering (`NFR-SEC-002`); `pdfjs-dist` runs with `isEvalSupported: false`. |
| TM-04 | Path traversal or reserved device name injection in output filenames or ZIP bundles | `sanitizeFilename` strips directory separators, `..`, control characters, and Windows device names (`CON`, `PRN`, `AUX`, `NUL`); `deconflictBatchFilenames` prevents overwrites (`FR-WF-006`). |
| TM-05 | False sense of security from visual cropping or visual signatures | Explicit UI and output warnings disclose that `Crop PDF` modifies page view boxes rather than erasing hidden streams (`C5.4`), and `Sign PDF` applies a visual stamp rather than an X.509 signature (`C7.9`). |
| TM-06 | Main-thread denial of service from huge batches | Resource threshold check warns above 150 MiB or 50 files (`FR-FILE-007`); PDF previews render lazily one page at a time and release canvas bitmaps immediately (`NFR-PERF-002`). |
