---
page: src/content/docs/build/working-with-entities.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Working with entities — correctness review

## Summary
Correctness posture: major. The page contains three critical endpoint path errors that would cause all curl examples to fail. Readers following the examples verbatim against a live cyoda-go instance will receive 404 errors. The narrative is otherwise sound, but the worked examples are fundamentally broken. Verdict: fix endpoint paths immediately.

## Correctness findings

### F1 — Entity creation endpoint path — **Fix now**
**Doc says:** `curl -X POST http://localhost:8080/api/models/orders/entities \`
**Ground truth:** The cyoda-go REST API endpoint is `/api/entity/{format}/{entityName}/{modelVersion}` where `{format}` is a required path parameter (e.g. "JSON"). The canonical example should be `http://localhost:8080/api/entity/JSON/orders/1` for the orders model version 1. `api/openapi.yaml` documents `/entity/{format}/{entityName}/{modelVersion}:` as the POST endpoint.
**Citation:** `api/openapi.yaml:L2182` (path `/entity/{format}/{entityName}/{modelVersion}`), `internal/domain/entity/handler.go:L106` (Create handler signature)
**Remediation:** Replace all examples using `/api/models/{entityName}/entities` with `/api/entity/JSON/{entityName}/{modelVersion}`. Update the "Read" section's GET example similarly.

### F2 — Entity retrieval by ID endpoint path — **Fix now**
**Doc says:** `curl http://localhost:8080/api/models/orders/entities/ORD-42 \`
**Ground truth:** The endpoint is `/api/entity/{entityId}` (single path segment, not a hierarchical path). `api/openapi.yaml` documents `/entity/{entityId}:` as the GET endpoint.
**Citation:** `api/openapi.yaml:L1053` (path `/entity/{entityId}:`), `internal/domain/entity/handler.go:L200+` (GetEntity handler)
**Remediation:** Change to `http://localhost:8080/api/entity/ORD-42`.

### F3 — Transition invocation endpoint path — **Fix now**
**Doc says:** `POST /api/models/orders/entities/ORD-42/transitions/submit`
**Ground truth:** The endpoint is `/api/entity/{format}/{entityId}/{transition}` where format is a required path parameter. The transition name comes at the end after the entity ID with format in between. Correct path: `/api/entity/JSON/{entityId}/{transition}` or `/api/entity/JSON/ORD-42/submit`.
**Citation:** `api/openapi.yaml:L2035` (path `/entity/{format}/{entityId}/{transition}:`), `internal/domain/entity/transitions_handler.go:L25+` (TransitionEntity handler)
**Remediation:** Update to `/api/entity/JSON/ORD-42/submit` (verify exact path-parameter order against generated.go).

### F4 — List entities endpoint — **Fix now**
**Doc says:** `GET /api/models/orders/entities?state=submitted&customerId=CUST-7`
**Ground truth:** The page references a "list with a filter" endpoint but the actual cyoda-go API provides `/api/entity/{entityName}/{modelVersion}` (GET) for listing entities. Query parameters for filtering are not documented as supported on this endpoint in the OpenAPI spec; filtering is primarily a search operation. This example conflates list/filter with search.
**Citation:** `api/openapi.yaml:L1324` (path `/entity/{entityName}/{modelVersion}:` GET operation), `internal/domain/entity/handler.go:L229+` (ListEntities handler)
**Remediation:** Either provide the correct endpoint `/api/entity/{entityName}/{modelVersion}` without the query-parameter filter claim, or redirect readers to the search endpoints for filtered queries.

### F5 — PATCH vs. PUT naming — **Reframe post-#80**
**Doc says:** "Direct field updates go through `PATCH`" but does not provide a worked example or full endpoint path.
**Ground truth:** cyoda-go does not document a PATCH endpoint in the OpenAPI spec. Updates are typically performed via PUT or through transition invocation. The page should clarify the exact endpoint or redirect to search+transition as the correct pattern.
**Citation:** `api/openapi.yaml` (no PATCH endpoint for entity updates found)
**Remediation:** Remove or clarify the PATCH reference. Provide the correct endpoint for mutations (likely PUT /api/entity/{format}/{entityId} or transition-based). After #80 (help system), replace with a reference to `cyoda help entities update`.

## Clarity suggestions

### C1 — Terminology inconsistency: "direct" vs. "immediate" search mode naming
The page uses "Immediate (API term: `direct`)" in the Search section, but earlier context uses the term "immediate" for UI-facing queries. Clarify upfront that cyoda uses the term "direct" for synchronous search and "async" for background search, or use direct/async consistently.

### C2 — Missing example of transition invocation payload
The Update section mentions "invoking the `submit` transition" but does not show the request body (if any). Readers are left to guess whether transitions require a payload or query parameters. Provide a minimal worked example.

## Coverage notes
- **Ungrounded claim:** "Example assumes a local cyoda-go instance running on the default port with SQLite persistence; the same requests work against Cyoda Cloud with the cloud endpoint and an issued token." This assumes parity with Cyoda Cloud's endpoint paths. The paths documented here are cyoda-go OSS paths; Cloud may differ. Do not claim parity without verification.
- **Expected but missing:** Endpoint reference table. A single reference table showing all entity-related endpoints (POST create, GET by ID, PUT update, DELETE, GET list, etc.) with correct paths and parameters would prevent examples from drifting. Currently, examples are scattered and inconsistent.
- **Present but thin:** Error handling. The page does not discuss HTTP status codes (404 for not found, 409 for conflict, etc.) or error response shapes. For a usage guide, this is light.
