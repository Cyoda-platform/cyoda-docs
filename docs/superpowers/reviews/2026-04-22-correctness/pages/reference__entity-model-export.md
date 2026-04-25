---
page: src/content/docs/reference/entity-model-export.mdx
section: reference
reviewed_by: wave2-reference
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Entity model export (SIMPLE_VIEW) — correctness review

## Summary
Documents the SIMPLE_VIEW export format (endpoint, response envelope, node descriptors, type descriptors, JSON Schema, and error shapes). The documented endpoint and response format align with the ledger and cyoda-go implementation. Concrete claims about node paths, type descriptors, and array representations are accurately grounded. The page is technically comprehensive and well-structured.

## Correctness findings
None.

## Clarity suggestions

### C1 — Array descriptor notation could be introduced earlier
The UniTypeArray notation `(TYPE x WIDTH)` is introduced late (in the "Array type descriptors" section). Readers first encounter it in examples without explanation. Consider a brief sidebar or inline definition at first use.

### C2 — Detached array rule ambiguity
The rule for when detached arrays are created is stated in two different ways: first as "multidimensional arrays beyond the first dimension", later clarified as "arrays of arrays create separate nodes." A single, consistent statement would reduce cognitive load.

### C3 — Polymorphic type ordering unspecified
The polymorphic section says types are "sorted by the internal `ComparableDataType` ordering (roughly: more specific types first, `STRING` last)." The word "roughly" signals imprecision. If the ordering is deterministic, cite the exact rule or function (e.g., the relevant cyoda-go source file).

## Coverage notes
- **Present but thin:** The JSON Schema section is comprehensive but does not explain how to *use* the schema for validation or codegen outside the export endpoint. A brief note — "this schema can be used to validate responses or generate client libraries" — would help.
- **Grounded claim:** The complete worked example demonstrates the full specification end-to-end and is useful.
