# Upstream issues — draft for review before filing

**Date:** 2026-04-21
**Purpose:** Drafts of 10 GitHub issues arising from the cyoda-docs
restructure pivot, the three-persona content review, and the
dropped-content audit. **Nothing here is filed yet.**

**Status:** 9 issues live; #5 **dropped** after clarification that
Confluent-style compatibility classes do not apply to the EDBMS model
(see Issue 5 for the full explanation).

**Convention:** Cross-repo documentation asks go on `Cyoda-platform/cyoda-go`
issues with the `cyoda-docs` (or `documentation`) label per internal practice.
Pure `cyoda-docs`-repo follow-ups (MCP server, our own inlining work) stay
on `Cyoda-platform/cyoda-docs`.

Each issue below is self-contained (doesn't require reading the review doc to
action). When you approve, I'll file the approved set with `gh issue create
--repo <repo> --label <label>` and record the resulting URLs back into this
file + the relevant `vendored/<area>/README.md` placeholders.

Cross-links used in the bodies:
- **Review:** `docs/superpowers/reviews/2026-04-21-three-persona-content-review.md`
- **PR:** https://github.com/Cyoda-platform/cyoda-docs/pull/66

---

## Issue 1 — OpenAPI as a versioned release asset

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `enhancement`
**Title:** Publish `openapi.json` as a versioned release asset

### Context
cyoda-docs embeds the REST API reference via an iframe-rendered Scalar /
Stoplight Elements viewer. Today the spec is fetched live from the cyoda-go
repo, which means docs.cyoda.net pins to a moving target and cannot reliably
represent a specific cyoda-go release.

### Proposal
Attach `openapi.json` (and optionally `openapi.yaml`) to every cyoda-go
release as a release asset. That lets cyoda-docs pin each doc build to a
named release and lets consumers download the spec for codegen against a
specific version. This is the same release-asset pattern proposed for the
rendered gRPC proto docs (#2) and — longer term — for any automated
docs artefact replacing the current `awaiting-upstream` banners on
`cli.mdx`, `configuration.mdx`, `helm.mdx` (see #9).

### Acceptance
- [ ] Release workflow attaches `openapi.json` as a release asset with
      a predictable, version-scoped URL pattern.
- [ ] Asset refreshes on every release (and ideally on every `main`
      push for preview builds).
- [ ] cyoda-docs build can fetch a known-version asset by tag.

---

## Issue 2 — gRPC proto docs as a versioned release asset

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `enhancement`
**Title:** Publish rendered gRPC proto docs as a versioned release asset

### Context
`concepts/apis-and-surfaces.md` names gRPC as a first-class surface and
`build/client-compute-nodes.md` documents the CloudEvents envelope in prose,
but there is no rendered proto reference a reader can browse. A compute-node
developer should be able to look up message shapes, field types, and enum
values without reading the `.proto` source.

### Proposal
Render the proto files into HTML or Markdown (buf, protoc-gen-doc, or
similar) and attach the output as a **release asset** on every cyoda-go
release — the same provisioning pattern as #1 (OpenAPI) so cyoda-docs has
a single, consistent way to consume versioned artefacts. Avoid
committing rendered docs to the cyoda-go repo; the release-asset
pattern keeps the repo lean and gives consumers explicit version
pinning.

### Acceptance
- [ ] CI generates rendered proto docs on every release tag.
- [ ] Output is attached as a release asset with a predictable,
      version-scoped URL pattern.
- [ ] cyoda-docs build can fetch a known-version asset by tag.

---

## Issue 3 — Error code catalogue

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Canonical error-code / error-type catalogue

### Context
The existing `ErrorCode` schema (`reference/schemas/common/error-code.mdx`
auto-generated) lists codes but with no explanation of when each fires, what
the suggested client response is, or whether the code is stable. A platform
team adopting cyoda-go needs a machine- and human-readable catalogue for SRE
runbooks, alerting, and support escalation.

### Proposal
Maintain a single source of truth for error codes in cyoda-go — either a
YAML/JSON manifest co-located with code, or doc-comments extracted at build
time — that includes: code, stability, meaning, retryable-yes/no, and a
suggested operator action.

### Acceptance
- [ ] One canonical source for error codes lives in cyoda-go
- [ ] Rendered/structured form is consumable by cyoda-docs
- [ ] New codes added in code are reflected without manual doc edits

---

## Issue 4 — Trino surface: fill remaining reference gaps

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Trino SQL surface — document dialect scope, push-down, isolation, performance envelope

### Context
cyoda-docs now has a ported Trino reference page at
[`/reference/trino/`](https://docs.cyoda.net/reference/trino/) covering
catalogue/schema projection rules, table naming, column categories,
primitive type mapping, polymorphic fields (including the temporal-type
resolution hierarchy), the JSON table, a complete worked example with
joins, and the JDBC URL template. The Build-side quickstart at
[`/build/analytics-with-sql/`](https://docs.cyoda.net/build/analytics-with-sql/)
links into it. What remains missing from the reference — and was flagged
by the three-persona content review — is the surface behaviour that a
data-platform engineer needs to size, tune, and trust production queries.

### Proposal
Produce upstream guidance that cyoda-docs can fold into
`/reference/trino/`, replacing the current "Gaps in this reference"
section:

1. **Supported SQL dialect scope.** Which Trino features are guaranteed
   supported versus best-effort? (ANSI joins, window functions, CTEs,
   grouping sets, arrays, map/row types, UDFs, DDL/DML policy).
2. **Push-down matrix.** Which predicates, projections, limits, and
   aggregates execute in the underlying store versus requiring a full
   scan. Especially relevant given the Cassandra backend on Cyoda Cloud.
3. **Consistency / isolation** of a long-running query relative to
   concurrent transition writes. Snapshot? Read-committed-at-T? Defined
   behaviour for `point_time`?
4. **Performance envelope** — rows/sec scan rates at a reference shape,
   per-tenant query limits, statement timeout defaults.

### Acceptance
- [ ] Each of the four topics is documented in a referenceable location
      upstream.
- [ ] cyoda-docs can remove the "Gaps in this reference" section at the
      bottom of `/reference/trino/` and inline the content.

---

## Issue 5 — DROPPED (not an upstream ask)

**Status:** Dropped — original framing mis-diagnosed the EDBMS model.
Resolved in-branch by clarifying the existing documentation.

### Original ask
Document forward / backward / full compatibility classes, full widening
lattice, reader/writer semantics, `modelVersion` definition, operational
meaning of "migrate".

### Why dropped
The three-persona review (data-engineer deep-dive) pattern-matched on
Confluent Schema Registry semantics (forward/backward/full compatibility
classes, reader/writer schemas, registry-incremented versions). That
taxonomy assumes the registry is the only source of structural truth for
downstream consumers. In an EDBMS, the entity **model + workflow** is the
contract together, and the workflow is the application logic.
"Compatible" is therefore not a platform-generic concept: only the
application knows whether a structural change leaves its transition
logic valid.

The platform contract is actually a simpler and stricter pair than
Confluent's:

| Mode | Cyoda | Confluent equivalent |
|------|-------|----------------------|
| Iterating | discover (widen) | approximately NONE (ad-hoc) |
| Contract frozen | locked (reject any non-match) | backward-compatible (still accepts widened writers — weaker) |

`modelVersion` is **application-controlled**, not platform-incremented —
the app bumps it when it wants a new structural contract, and old
revisions remain valid under their original version. Old revisions are
never re-validated or re-cast. Renames, deletes, deprecations, and
narrowing are all application-owned migrations against a new
`modelVersion`, because only the application knows what they mean for
downstream transition logic.

### Resolution on this branch
Docs clarity gap fixed in two places:

- `build/modeling-entities.md` — added "Two modes: discover or lock"
  section with an FpML-style production example; rewrote "Evolving a
  model" to state that `modelVersion` is application-controlled, that
  revisions are immutable, that the platform deliberately does not
  layer a Confluent-style compatibility taxonomy, and that migration
  is an app-owned operation.
- `concepts/entities-and-lifecycle.md` — added a short framing of the
  two modes in the Schema section, pointing at `modeling-entities.md`
  for depth.

### Why this matters for future reviewers
The review mis-framing is a real gotcha: anyone pattern-matching from
Kafka/Avro/Confluent will misread Cyoda's lock-and-reject model as
"incomplete" when it is in fact **stricter** than Confluent's
"backward-compatible" mode. The updated docs make the two-mode contract
explicit and explain why compat classes are not a platform concern.

---

## Issue 6 — CDC / event-out: confirm delivery semantics for outbox-via-processor recipe

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Confirm delivery semantics for outbox-via-processor so the docs recipe matches runtime behaviour

### Context
The three-persona review (data-engineer deep-dive) found **no non-gRPC,
non-processor event-out channel** anywhere in the docs — no Kafka topic,
outbox, webhook, CDC stream, NATS, SSE, or changefeed. The only option
available is "poll REST/Trino with a watermark" or "attach a gRPC processor
to every transition and produce to Kafka yourself." Silence on this blocks
adoption by teams running a Kafka / Debezium / Iceberg estate.

**Product decision taken:** we will land an **outbox-via-processor recipe**
in cyoda-docs (pseudo-code form) under Build. No first-class event-out
surface is planned for now.

### Proposal
Confirm upstream the runtime semantics the recipe should assume, so the
pseudo-code is faithful:

- Processor invocation delivery: **at-least-once**? Expected dedup key
  (e.g. `requestId` or transition id)?
- Ordering guarantees across transitions on a single entity. Across
  entities — none, assume concurrent?
- Replay behaviour on processor failure / retry — is the processor
  invoked again with the same ids?
- Idempotency contract the recipe should document for downstream
  consumers.

### Acceptance
- [ ] Delivery semantics documented upstream (design doc or
      runtime-contract page) so the docs recipe quotes real behaviour
- [ ] cyoda-docs lands `build/outbox-pattern.md` (or equivalent) with
      pseudo-code and a pointer to the upstream semantics page

---

## Issue 7 — Publish the ops interface surface (metrics, health, tracing)

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Document the ops-facing interface surface — canonical metric names, health/readiness paths, trace header contract

### Context
The three-persona review (platform-architect deep-dive) flagged gaps in
`run/` coverage. Taking a step back: a platform vendor's remit stops at
the **interface** ops teams integrate with — concrete metric names,
health/readiness endpoints, the trace-context contract. *How* to run the
show (PostgreSQL HA patterns, DR/RPO-RTO, sizing models, multi-AZ
placement, capacity planning) is tightly coupled to the operator's
infrastructure provider, app load profile, and compliance posture, and
is not in Cyoda's remit to prescribe.

What the review genuinely exposed is that the interface surface is
under-documented: observability lacks concrete metric names or endpoint
paths, and there is no published trace-header contract. That makes it
impossible for an ops team to wire alerting, dashboards, or distributed
tracing without reading the source. Fix the interface; leave the
playbook to the operator.

### Proposal
Produce upstream guidance cyoda-docs can cite under `run/`:

- **Metrics catalogue.** Canonical metric names emitted by cyoda-go, their
  types (counter/gauge/histogram), labels, and meaning. Stable-vs-
  evolving marker on each.
- **Health and readiness endpoints.** Path(s), expected response shape,
  what "ready" and "healthy" actually check.
- **Trace-context contract.** Which headers cyoda-go propagates
  (W3C `traceparent`/`tracestate`, B3, or other), where ids appear in
  logs, and the correlation contract across REST, gRPC, and processor
  invocations.
- **Structured-log schema.** Key field names (`request_id`,
  `entity_id`, `transition`, etc.) and their stability.

Deliberately **out of scope**: Postgres HA recipes, DR targets, sizing
models, multi-AZ placement. Those belong to the operator, not the
platform vendor.

### Acceptance
- [ ] Metrics, health, tracing, and log-schema references exist upstream
- [ ] cyoda-docs `run/observability.md` (and neighbours) can cite them
      directly

---

## Issue 8 — MCP docs server

**Repo:** `Cyoda-platform/cyoda-docs`
**Labels:** `documentation`, `tooling`
**Title:** Ship an MCP server for cyoda-docs

### Context
An MCP server over cyoda-docs would let IDE/LLM tooling pull authoritative
doc content (reference pages, schemas, concept articles) into coding
sessions rather than hallucinating or relying on stale web search. The
markdown export (`npm run build:markdown` → `dist/markdown/`) and
`llms.txt` are already in place; an MCP server is the thin shim on top.

### Proposal
Scope a small MCP server (Node or Go) that exposes:

- `list_pages` / `get_page` against the markdown export
- `search` against page titles + first paragraph
- `list_schemas` / `get_schema` against the JSON schemas in `src/schemas/`

Ship as a subdirectory in cyoda-docs or a sibling repo.

### Acceptance
- [ ] MCP server runs locally and returns doc content
- [ ] Documented quickstart in cyoda-docs for an IDE user

---

## Issue 9 — Inline awaiting-upstream reference content from cyoda-go source

**Repo:** `Cyoda-platform/cyoda-docs`
**Labels:** `documentation`, `follow-up`
**Title:** Replace `awaiting-upstream` stubs with hand-curated content scanned from cyoda-go

### Context
Three reference pages carry the `awaiting-upstream` banner:
`reference/cli.mdx`, `reference/configuration.mdx`, `reference/helm.mdx`.
The three-persona review (platform-architect deep-dive) found this pattern
actively harms credibility — architects read it as "they haven't even filed
the ticket." The underlying artefacts (CLI `--help` output, env-var
definitions, Helm `values.yaml`) all exist in the cyoda-go repo; we can
hand-curate summaries now and mark them `stability="evolving"` instead of
`awaiting-upstream`.

### Proposal
Scan the local cyoda-go repositories (`~/go-projects/cyoda-light/cyoda-go`,
`cyoda-go-spi`, `cyoda-go-cassandra`) and produce:

- `reference/cli.mdx`: subcommand table with one-line purpose + common
  invocations
- `reference/configuration.mdx`: top-20 env-var table (var, type, default,
  purpose) + `_FILE` secret example
- `reference/helm.mdx`: commented `values.yaml` excerpt + 3-row
  "minimum-viable overrides" table

Mark all three `stability="evolving"`. File a follow-up ticket (or leave
this one open) to automate the scan/refresh once cyoda-go publishes
canonical artefacts (see Issues 1–3 and 7).

### Acceptance
- [ ] Three stub pages replaced with hand-curated content
- [ ] Banners updated from `awaiting-upstream` → `evolving`
- [ ] Review-doc item 7 (ranked fix list) marked complete

---

## Issue 10 — REST search grammar on `build/searching-entities.md`

**Repo:** `Cyoda-platform/cyoda-docs`
**Labels:** `documentation`, `follow-up`
**Title:** Document REST search grammar as a dedicated Build page

### Context
`build/working-with-entities.md` gestures at search with a link to
`/reference/api/#search` — an anchor that currently resolves to a
launcher page, which the three-persona review flagged as a dead link.
The REST querying story (predicates, pagination, `pointTime=` for
historical reads, search payload shape) needs its own Build page
mirroring the shape of `build/analytics-with-sql.md`. That matches the
one-Build-page-per-surface-role pattern: REST ↔ search, gRPC ↔ compute,
Trino ↔ analytics.

### Proposal
Create `build/searching-entities.md` covering:

- The two query modes: **Immediate** (`direct` — capped result
  size, synchronous) and **Background** (`async` — unbounded, paged,
  handle-based). Explain when to pick each.
- The Cassandra tier's distributed `async` search: horizontally
  scalable, throughput grows roughly linearly with node count
  (available on Cyoda Cloud and licensed Enterprise installs).
- Search predicate grammar (fields, operators, combinators).
- Pagination and sort for `async`.
- Historical reads with `pointTime=` and interaction with the
  current state.
- Worked examples against the `orders` model used elsewhere in
  Build.
- Pointer to the REST API reference for the machine-readable schema
  of the search payload.

Update `build/working-with-entities.md` to link to the new page and
remove the `/reference/api/#search` dead anchor. (The basic
direct/async framing now lives on `working-with-entities.md` as of
2026-04-21; the new page deepens it.)

### Acceptance
- [ ] `build/searching-entities.md` exists and is in the Build sidebar.
- [ ] No build pages link to the dead `/reference/api/#search` anchor.
- [ ] Review-doc ranked-fix-list item 5 is partially resolved (the
      search half; the temporal-anchor half is covered by the Trino
      port and ongoing temporal work).

---

## Filing plan (once approved)

For each approved issue:

1. `gh issue create --repo <repo> --label <labels> --title <title> --body-file <extracted body>`
2. Record the resulting URL under the issue heading in this file (append `**Filed:** <url>`)
3. If relevant, update the corresponding `vendored/<area>/README.md` placeholder on this branch

Numbering is stable — issue numbering here is just for this draft, not for
GitHub issue numbers.
