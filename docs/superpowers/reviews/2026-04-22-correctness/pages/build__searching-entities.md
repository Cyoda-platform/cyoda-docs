---
page: src/content/docs/build/searching-entities.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Searching entities — correctness review

## Summary
Correctness posture: major. The page contains critical endpoint path errors identical to working-with-entities.md. All curl examples use `/api/models/orders/search` which does not exist in cyoda-go; correct paths are `/api/search/direct/{entityName}/{modelVersion}` and `/api/search/async/{entityName}/{modelVersion}`. The search mode concepts (direct vs. async) are sound, but the worked examples are non-functional. Verdict: fix endpoint paths immediately.

## Correctness findings

### F1 — Direct search endpoint path — **Fix now**
**Doc says:** `curl -X POST http://localhost:8080/api/models/orders/search \`
**Ground truth:** The cyoda-go endpoint is `/api/search/direct/{entityName}/{modelVersion}` (POST). The example should be `http://localhost:8080/api/search/direct/orders/1`.
**Citation:** `api/openapi.yaml:L5324` (path `/search/direct/{entityName}/{modelVersion}:`), `internal/domain/search/handler.go:L36` (SearchEntities handler)
**Remediation:** Replace all instances of `/api/models/{entityName}/search` with `/api/search/direct/{entityName}/{modelVersion}`.

### F2 — Async search submission endpoint path — **Fix now**
**Doc says:** Same error as F1 above in the "An async search" section.
**Ground truth:** The endpoint is `/api/search/async/{entityName}/{modelVersion}` (POST).
**Citation:** `api/openapi.yaml:L5001` (path `/search/async/{entityName}/{modelVersion}:`), `internal/domain/search/handler.go:L99` (SubmitAsyncSearchJob handler)
**Remediation:** Replace with `/api/search/async/{entityName}/{modelVersion}`.

### F3 — Async search status and results endpoint paths — **Fix now**
**Doc says:** `GET /api/search/{searchId}/status` and `GET /api/search/{searchId}/results?page=0`
**Ground truth:** The endpoints are `/api/search/async/{jobId}/status` (GET status) and `/api/search/async/{jobId}` (GET results with pagination). The parameter is named `jobId`, not `searchId`.
**Citation:** `api/openapi.yaml:L5274` (path `/search/async/{jobId}/status:`), `api/openapi.yaml:L5159` (path `/search/async/{jobId}:`), `internal/domain/search/handler.go:L136` (GetAsyncSearchStatus) and L151 (GetAsyncSearchResults)
**Remediation:** Update all references from `{searchId}` to `{jobId}` and from `/api/search/` to `/api/search/async/`. Clarify that status and results endpoints both use the same job ID returned by the submission endpoint.

### F4 — Async search cancellation endpoint — **Fix now**
**Doc says:** Page does not document cancellation explicitly, but the full endpoint exists.
**Ground truth:** The cancellation endpoint is `/api/search/async/{jobId}/cancel` (DELETE). `internal/domain/search/handler.go:L216` (CancelAsyncSearch handler).
**Citation:** `api/openapi.yaml:L5234` (path `/search/async/{jobId}/cancel:`), `internal/domain/search/handler.go:L216`
**Remediation:** Add a brief section documenting cancellation: "To cancel an in-progress async search: `DELETE /api/search/async/{jobId}/cancel`."

### F5 — Filter shape and operator reference — **Reframe post-#80**
**Doc says:** "Treat the reference as the source of truth for the exact operator names and nesting rules; Cyoda's REST spec is published as an OpenAPI asset..." but then points to issue #81 on GitHub.
**Ground truth:** The ledger documents that search predicate grammar includes: simple (jsonPath, operatorType, value), group (AND/OR/NOT, nested), function, lifecycle, and array criteria types. The page mentions only the equality shortform and references the full grammar without providing even a specimen of the full form beyond one example.
**Citation:** `internal/domain/search/filter_translate.go` (predicate parsing), ledger section "Search"
**Remediation:** After #80, replace the GitHub issue reference with a direct link to `cyoda help search predicates` or inline a brief reference of the supported operator types (EQUALS, GREATER_THAN, CONTAINS, etc.). Currently, readers have no way to know what operators are valid without reading the OpenAPI file directly.

## Clarity suggestions

### C1 — Point-in-time parameter semantics
The page states "Every search accepts a `pointInTime` parameter to run against the world as it existed at a given timestamp. The result is the set of entities that would have matched, using the revision active at that time." This is correct but assumes readers understand the temporal-revision model. Add one sentence clarifying: "Each entity maintains a history of revisions; point-in-time queries return results using the entity state that was current at the specified timestamp."

### C2 — Paging semantics on async search
The section "Paging and sort (async)" states "pageSize is set at submission time" but the OpenAPI spec and handler code show `pageSize` is a query parameter on the results endpoint, not the submission. Verify this and clarify that `pageSize` applies at result-fetch time, not job submission time.

### C3 — Sort order specification
The page says "Sort keys go in the submission body" but does not show the JSON shape. Provide a minimal worked example or point to the OpenAPI schema.

## Coverage notes
- **Expected but missing:** Sort order specification. The section mentions "Sort keys go in the submission body" but does not show how to specify sort keys in the JSON request body. Provide an example or reference.
- **Ungrounded claim:** "On the Cassandra-backed tier (Cyoda Cloud, or a licensed Enterprise install), `async` runs distributed across the cluster: for a fixed query shape, throughput scales roughly linearly with the number of nodes." This is a Cloud/Enterprise claim. On OSS cyoda-go (the scope of this page), async search is single-node. Add a note clarifying this scales differently on OSS vs. Cloud.
- **Present but thin:** Historical reads are documented briefly but do not explain the timestamp format (ISO 8601 is mentioned in examples but the page assumes familiarity). Clarify: "Use ISO 8601 format (e.g., `2026-03-01T00:00:00Z`) for the `pointInTime` parameter. The timezone must be UTC."
