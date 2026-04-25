---
page: src/content/docs/index.mdx
section: getting-started
reviewed_by: wave2-getting-started
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Root landing — correctness review

## Summary

The root landing page contains no factual claims that are verifiably wrong against cyoda-go at the pinned commit. Positioning and navigation prose only; no specific API claims, CLI claims, or feature claims that can be grounded against the implementation. The onramp pointer to install-and-first-entity is correct in direction, though the target page itself requires fixes (see its review).

## Correctness findings

None. The page does not make testable claims against cyoda-go.

## Clarity suggestions

None. Landing-page voice is intentional.

## Coverage notes

The page correctly points to install-and-first-entity as the new-user entry point. Once that page is corrected per its review, the onramp will be aligned. Growth-path diagram and tier descriptions (local cyoda-go → PostgreSQL → Cyoda Cloud) are accurate to product strategy but not verifiable against code; they are positioning, not implementation claims.
