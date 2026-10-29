# FlowPDF Feature Matrix & Traceability Log

> Synchronized with `src/registry/tools.ts` and PRD Section A4.2 & E8.

| Catalogue ID | Tool ID | Tool Name | Phase | Status | Adapter / Gate Reference |
|---|---|---|---|---|---|
| `CAT-ORG-001` | `merge-pdf` | Merge PDF | P0 | **Available** | `MergeAndImageAdapter` |
| `CAT-ORG-002` | `split-pdf` | Split PDF | P1 | **Available** | `PagesAdapter` |
| `CAT-ORG-003` | `organize-pdf` | Organize PDF | P1 | **Available** | `PagesAdapter` + `OrganizePagesGrid` |
| `CAT-ORG-004` | `remove-pages` | Remove Pages | P1 | **Available** | `PagesAdapter` |
| `CAT-ORG-005` | `extract-pages` | Extract Pages | P1 | **Available** | `PagesAdapter` |
| `CAT-ORG-006` | `copy-pdf` | Copy PDF | P2 | **Available** | `PagesAdapter` |
| `CAT-ORG-007` | `scan-to-pdf` | Scan to PDF | P2 / TG | Planned | Device camera capture gate |
| `CAT-OPT-001` | `compress-pdf` | Compress PDF | P0 / TG | **Available** | `CompressPdfAdapter` (`ADR-0001`) |
| `CAT-OPT-002` | `repair-pdf` | Repair PDF | P2 / TG | Research | `ADR-0005` |
| `CAT-OPT-003` | `ocr-pdf` | OCR PDF | P2 / TG | Research | `ADR-0004` |
| `CAT-OPT-004` | `optimize-scan` | Optimize Scanned Pages | P2 | Planned | Scan downsampling calibration |
| `CAT-IN-001` | `jpg-to-pdf` | JPG to PDF | P0 | **Available** | `MergeAndImageAdapter` |
| `CAT-IN-002` | `png-to-pdf` | PNG to PDF | P0 | **Available** | `MergeAndImageAdapter` |
| `CAT-IN-003` | `image-to-pdf` | Image to PDF (JPG & PNG) | P1 / TG | **Available** | `MergeAndImageAdapter` |
| `CAT-IN-004` | `word-to-pdf` | Word to PDF | P3 / TG | Research | `ADR-0003` |
| `CAT-IN-005` | `powerpoint-to-pdf` | PowerPoint to PDF | P3 / TG | Research | `ADR-0003` |
| `CAT-IN-006` | `excel-to-pdf` | Excel to PDF | P3 / TG | Research | `ADR-0003` |
| `CAT-IN-007` | `html-to-pdf` | HTML to PDF | P2 / TG | Research | Sandboxed sanitizer gate |
| `CAT-IN-008` | `markdown-to-pdf` | Markdown to PDF | P2 | **Available** | `ConvertAdapter` |
| `CAT-OUT-001` | `pdf-to-jpg` | PDF to JPG | P1 | **Available** | `ConvertAdapter` |
| `CAT-OUT-002` | `pdf-to-png` | PDF to PNG | P1 | **Available** | `ConvertAdapter` |
| `CAT-OUT-003` | `pdf-to-word` | PDF to Word | P3 / TG | Research | `ADR-0003` |
| `CAT-OUT-004` | `pdf-to-powerpoint` | PDF to PowerPoint | P3 / TG | Research | `ADR-0003` |
| `CAT-OUT-005` | `pdf-to-excel` | PDF to Excel | P3 / TG | Research | `ADR-0003` |
| `CAT-OUT-006` | `pdf-to-pdfa` | PDF to PDF/A | P2 / TG | Blocked | Conformance validator required |
| `CAT-OUT-007` | `pdf-to-markdown` | PDF to Markdown | P2 | **Available** | `ConvertAdapter` |
| `CAT-OUT-008` | `pdf-extract` | PDF Asset Extract | P2 / TG | Planned | XObject stream decoder gate |
| `CAT-OUT-009` | `pdf-to-text` | PDF to Text | P2 | **Available** | `ConvertAdapter` |
| `CAT-EDIT-001` | `rotate-pdf` | Rotate PDF | P1 | **Available** | `EditPdfAdapter` |
| `CAT-EDIT-002` | `add-page-numbers` | Add Page Numbers | P2 | **Available** | `EditPdfAdapter` |
| `CAT-EDIT-003` | `add-watermark` | Add Watermark | P2 | **Available** | `EditPdfAdapter` |
| `CAT-EDIT-004` | `crop-pdf` | Crop PDF | P2 | **Available** | `EditPdfAdapter` |
| `CAT-EDIT-005` | `edit-pdf` | Edit PDF Overlays | P2 / TG | Planned | Interactive coordinate canvas |
| `CAT-EDIT-006` | `pdf-forms` | Fill PDF Forms | P2 / TG | Research | AcroForm field matrix gate |
| `CAT-EDIT-007` | `annotate-pdf` | Annotate PDF | P2 | Planned | Interactive overlay canvas |
| `CAT-EDIT-008` | `insert-replace-pages` | Insert / Replace Pages | P2 | Planned | Page mapping dialog |
| `CAT-SEC-001` | `protect-pdf` | Protect PDF | P2 / TG | Research | AES-256 WASM cipher audit |
| `CAT-SEC-002` | `unlock-pdf` | Unlock PDF | P2 / TG | Research | Encrypted stream rewrite gate |
| `CAT-SEC-003` | `sign-pdf` | Sign PDF (Visual Appearance) | P2 | **Available** | `SecurityAdapter` (`ADR-0006`) |
| `CAT-SEC-004` | `digital-signature-pdf` | Digital PDF Signature (X.509) | P3 / TG | Blocked | `ADR-0006` |
| `CAT-SEC-005` | `redact-pdf` | Redact PDF | P3 / TG | Blocked | `ADR-0005` |
| `CAT-SEC-006` | `compare-pdf` | Compare PDF | P2 / TG | Research | Visual/text diff alignment gate |
| `CAT-SEC-007` | `sanitize-metadata` | Sanitize PDF Metadata | P2 | **Available** | `SecurityAdapter` |
| `CAT-AI-001` | `ai-summarizer` | AI PDF Summarizer | P3 / TG | Blocked | `ADR-0007` |
| `CAT-AI-002` | `pdf-translation` | PDF Translation | P3 / TG | Blocked | `ADR-0007` |
| `CAT-AI-003` | `ask-pdf` | Ask / Search within PDF | P3 / TG | Research | `ADR-0007` |
| `CAT-AI-004` | `ocr-assisted-conversion` | OCR-Assisted Conversion | P3 / TG | Research | `ADR-0004` & `ADR-0007` |
| `CAT-WF-001` | `workflow-builder` | Workflow Builder | P3 / TG | **Available** | `WorkflowAdapter` |
| `CAT-WF-002` | `batch-processing` | Batch Processing | P2 | **Available** | `WorkflowAdapter` |
