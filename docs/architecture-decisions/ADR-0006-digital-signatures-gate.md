# ADR-0006: Visual Signatures vs. Cryptographic Digital Signatures (`CAT-SEC-003`, `CAT-SEC-004`)

- **Status:** Accepted
- **Date:** 2026-10-29
- **Owner:** Security & Privacy Reviewer

## Context

Users often confuse a visual signature stamp (`CAT-SEC-003`) with a cryptographic PKCS#7 / X.509 digital signature (`CAT-SEC-004`).

## Decision

1. Expose **`sign-pdf` (`CAT-SEC-003`, Visual Appearance)** as `available` with the mandatory warning required by PRD Section C7.9: `"This is a visual signature, not a cryptographic digital signature."`
2. Keep **`digital-signature-pdf` (`CAT-SEC-004`)** as **`blocked`** until local PKCS#12 key handling, byte-range digest calculation, and certificate chain validation pass independent security review.
