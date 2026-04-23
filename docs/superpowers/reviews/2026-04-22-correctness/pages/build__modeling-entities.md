---
page: src/content/docs/build/modeling-entities.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Modeling entities — correctness review

## Summary
Correctness posture: clean on conceptual material. One-line clarity: "Two modes" (discover/lock) is well motivated and grounded. Verdict: no changes required. All major claims are either narrative/pattern-based (not verifiable from cyoda-go directly) or align with the model lifecycle implementation in `internal/domain/model/service.go`.

## Correctness findings
None.

## Clarity suggestions
None.

## Coverage notes
- **Expected but missing:** Specific field names for the `ChangeLevel` enum values (ARRAY_LENGTH, ARRAY_ELEMENTS, TYPE, STRUCTURAL) appear in the ledger but not explicitly listed in a reference table on this page. They are mentioned in prose but a quick-lookup table would help. Not a blocker.
- **Present but thin:** "Type hierarchy" for polymorphic widening is mentioned (e.g. `BYTE → SHORT → INT → LONG`) but readers are redirected to [Trino SQL reference](/reference/trino/) for the complete lattice. On an OSS-tier page, this is a pointer to a non-existent/Cloud-only page, creating potential confusion.
