---
page: src/content/docs/getting-started/install-and-first-entity.mdx
section: getting-started
reviewed_by: wave2-getting-started
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Install and first entity — correctness review

## Summary

Multiple correctness failures in the primary OSS onramp. The `cyoda serve` subcommand does not exist (the binary starts the server when invoked as bare `cyoda`); all three REST endpoint paths follow the wrong pattern (`/api/models/...` instead of the canonical `/api/entity/{format}/{entityName}/{modelVersion}`); one env var name is wrong (`CYODA_STORAGE` should be `CYODA_STORAGE_BACKEND`); the example workflow's `initialState` diverges from the default workflow without explanation. Must be corrected before an OSS user following it can complete the first-entity flow successfully.

## Correctness findings

### F1 — `cyoda serve` subcommand does not exist — **Fix now**
**Doc says:** "Start the server with the defaults: `cyoda serve`" (L43); "`cyoda serve` defaults to **mock auth**" (L56)
**Ground truth:** `cmd/cyoda/main.go:L36-48` switches on only `--help`/`-h`, `init`, `health`, `migrate`. The server is started by invoking the binary with no subcommand. `cyoda serve` happens to fall through to the server-start path (the `serve` argument is ignored) but `serve` is not a recognized subcommand.
**Citation:** `cmd/cyoda/main.go:L36-48`; ledger §CLI.
**Remediation:** Replace `cyoda serve` with `cyoda` on L43 and L56 (bare binary invocation).

### F2 — REST endpoint path pattern wrong — **Fix now**
**Doc says (L50):** `curl -X POST http://localhost:8080/api/models/orders/entities ...`
**Doc says (L98):** `curl -X POST http://localhost:8080/api/models/orders/entities/ORD-1/transitions/submit`
**Doc says (L106):** `curl http://localhost:8080/api/models/orders/entities/ORD-1`
**Ground truth:** The canonical paths are `/api/entity/{format}/{entityName}/{modelVersion}` (POST create), `/api/entity/{format}/{entityId}/{transition}` (POST named transition, where `{entityId}` is the UUID returned from create — not the business ID), and `/api/entity/{entityId}` (GET by UUID) or `/api/entity/{entityName}/{modelVersion}` (GET list). No `/api/models/*/entities` pattern exists in cyoda-go.
**Citation:** `api/openapi.yaml:L2182` (POST create), `api/openapi.yaml:L2035` (transition), `api/openapi.yaml:L1053` (GET by entityId), `api/openapi.yaml:L1324` (GET list); ledger §REST Surface.
**Remediation:**
- L50 path → `/api/entity/JSON/orders/1` (format=JSON, entityName=orders, modelVersion=1).
- L98 path → `/api/entity/JSON/{entityId}/submit` where `{entityId}` is the UUID returned by the create response (not "ORD-1"). Alternatively, reframe the example so it first creates a minimal entity, captures the returned UUID, then uses it in the transition URL.
- L106 path → `/api/entity/{entityId}` to fetch by UUID, or `/api/entity/orders/1` to list.

### F3 — Example workflow `initialState` diverges from default without explanation — **Fix now**
**Doc says (L78):** `"initialState": "draft"`
**Ground truth:** `internal/domain/workflow/default_workflow.json:L5` shows `"initialState": "NONE"`. When no workflows are imported, the engine loads the default workflow with NONE as the initial state. If the page's example workflow is meant to be imported by the reader (replacing the default), this needs to be explicit; otherwise readers will be confused when their entity's state does not match the doc.
**Citation:** `internal/domain/workflow/default_workflow.json:L5`; `internal/domain/workflow/engine.go:L120-124` (default-workflow loading path); ledger §"Workflow JSON Shape".
**Remediation:** Either (a) add a step that explicitly imports the custom workflow before creating the entity, so the reader's actual `initialState` will be "draft", or (b) align the example with the default (`"initialState": "NONE"`) and use the default state names (NONE, CREATED, DELETED).

### F4 — Environment variable name wrong — **Fix now**
**Doc says (L126):** `CYODA_STORAGE=memory`
**Ground truth:** `app/config.go:L110` reads `CYODA_STORAGE_BACKEND` (not `CYODA_STORAGE`). A user typing `export CYODA_STORAGE=memory` sees no effect.
**Citation:** `app/config.go:L110`; ledger §Configuration.
**Remediation:** Change `CYODA_STORAGE=memory` to `CYODA_STORAGE_BACKEND=memory` on L126.

### F5 — Homebrew postinstall claim unverifiable from cyoda-go — **Reframe post-#80**
**Doc says (L25):** "The Homebrew formula runs `cyoda init` for you, enabling SQLite persistence with data stored in `~/.local/share/cyoda/cyoda.db`."
**Ground truth:** This depends on the Homebrew formula's postinstall script, not cyoda-go code. The claim is plausible but cannot be verified from the cyoda-go repository at the pinned commit.
**Citation:** Out of scope (Homebrew formula, not cyoda-go).
**Remediation:** Either verify against the actual Homebrew formula and keep the claim, or hedge it ("Homebrew is expected to run `cyoda init` automatically; if it does not, run it manually"). Post-#80, reference `cyoda help init` for the authoritative behavior description.

## Clarity suggestions

### C1 — Business-ID vs UUID confusion in transition example
The example creates an entity with `{ "orderId": "ORD-1", ... }` then transitions at `/ORD-1/transitions/submit`. This conflates the business key ("ORD-1") with the entity's UUID (the REST identifier). Fixing F2 clarifies this but the underlying confusion warrants an inline note: "The ID in the URL is the system-assigned UUID returned in the POST response, not the business key like `orderId`."

### C2 — Workflow import step missing from flow
The workflow is introduced (L74-89) separately from the create flow. If the reader is expected to import this workflow before create, the step should appear in narrative order: (1) import workflow, (2) create entity, (3) observe automatic transitions, (4) invoke manual transition. Otherwise the example is disjoint.

### C3 — Automatic-transition cascade behavior not explained
If the example workflow's `initialState: "draft"` has an automatic transition to "submitted", the entity will enter "submitted" immediately on create, not "draft". Readers expecting to see "draft" state after create will be surprised. Add: "Automatic transitions (`manual=false`) fire immediately on creation, cascading the entity through applicable states until it reaches one with no outgoing auto transitions."

## Coverage notes

- **Expected but missing:** End-to-end verified curl sequence. After F1–F4 are fixed, run the sequence locally against a fresh cyoda-go to confirm the flow works as documented. `internal/e2e/entity_lifecycle_test.go` is the pinned contract for this flow.
- **Present but thin:** Relationship between the default workflow (NONE → CREATED → DELETED) and the custom workflow example is not explained. This creates the F3 ambiguity.
