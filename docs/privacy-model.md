# FlowPDF Privacy Model

> Reference: PRD Section 1 (Product Commitments #1 & #2), Section C2.2, and `NFR-PRIV-001..002`.

## Governing Commitments

1. **Client-Side Processing by Default:**
   All file reading, structural validation, merging, splitting, page organization, compression, image rendering, Markdown conversion, visual signing, and metadata sanitization occur locally inside the user's browser using JavaScript, Web Workers, and browser APIs.
2. **Zero Document Egress:**
   No document bytes, filenames, extracted text, page previews, or generated outputs are transmitted to FlowPDF servers or third-party endpoints.
3. **No Persistent Document Storage:**
   FlowPDF does not use `localStorage`, `sessionStorage`, `IndexedDB`, `CacheStorage`, or cookies to store user documents, filenames, or derived text.
4. **Honest Memory Disclosure:**
   Temporary in-memory `ArrayBuffer` and `Blob` objects are released when queues are cleared or tasks finish. Browser garbage collection and OS virtual-memory management are best-effort and are never represented as forensic secure erasure.
