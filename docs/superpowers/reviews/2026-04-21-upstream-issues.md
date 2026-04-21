# Upstream issues — draft for review before filing

**Date:** 2026-04-21
**Purpose:** Drafts of 9 GitHub issues arising from the cyoda-docs restructure
pivot and the three-persona content review. **Nothing here is filed yet.**

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

## Issue 1 — OpenAPI as a release artefact

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `enhancement`
**Title:** Publish `openapi.json` as a versioned release artefact

### Context
cyoda-docs embeds the REST API reference via an iframe-rendered Scalar /
Stoplight Elements viewer. Today the spec is fetched live from the cyoda-go
repo, which means docs.cyoda.net pins to a moving target and cannot reliably
represent a specific cyoda-go release.

### Proposal
Attach `openapi.json` (and optionally `openapi.yaml`) to every cyoda-go
release. That lets cyoda-docs pin each doc build to a named release, and
lets consumers download the spec for codegen against a specific version.

### Acceptance
- [ ] Release workflow attaches `openapi.json` as a release asset
- [ ] The release tag is referenced in the asset filename or URL
- [ ] cyoda-docs build can fetch a known-version asset

---

## Issue 2 — gRPC proto rendering

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `enhancement`
**Title:** Publish rendered gRPC proto docs

### Context
`concepts/apis-and-surfaces.md` names gRPC as a first-class surface and
`build/client-compute-nodes.md` documents the CloudEvents envelope in prose,
but there is no rendered proto reference a reader can browse. A compute-node
developer should be able to look up message shapes, field types, and enum
values without reading the `.proto` source.

### Proposal
Render the proto files into HTML or Markdown (buf, protoc-gen-doc, or
similar) and either (a) publish as a release asset, or (b) commit to a
`docs/proto/` path that cyoda-docs can import.

### Acceptance
- [ ] Proto docs are generated in CI
- [ ] Output is consumable by cyoda-docs (path or release asset agreed)
- [ ] Refresh happens on every release or main-branch change

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

## Issue 4 — Trino surface reference

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Canonical reference for the Trino SQL surface

### Context
`concepts/apis-and-surfaces.md` names Trino as one of three first-class
surfaces and `run/cyoda-cloud/index.mdx` advertises JDBC. A three-persona
content review found the Trino surface is **7/8 UNANSWERED** for a data
engineer trying to prototype against it — no catalogue name, no JDBC URL
template, no supported SQL subset, no nested-type projection example, no
`AS OF` syntax for temporal reads, no push-down matrix, no isolation/
consistency statement, no performance envelope. Today the surface is
marketing prose with a `/reference/trino/` page promised-but-missing
(`concepts/apis-and-surfaces.md:70-72`).

### Proposal
Produce a canonical Trino surface spec in cyoda-go (or whichever repo owns
the connector). At minimum:

- Catalogue name and schema model (per-tenant? per-model?)
- Table-naming rule for an entity type with a nested array (worked example)
- JDBC URL template + auth recipe (OAuth 2.0 bearer → JDBC)
- Supported SQL dialect subset (joins, window functions, CTEs; disallowed
  DDL/DML)
- Temporal read syntax (reconcile with REST's `pointTime=`)
- Push-down matrix
- Concurrency / isolation statement for long-running queries

### Acceptance
- [ ] Canonical source exists
- [ ] cyoda-docs can render or link to it as `/reference/trino/`

---

## Issue 5 — Schema-evolution compatibility classes

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `product-spec`
**Title:** Document forward / backward / full schema compatibility semantics

### Context
`concepts/entities-and-lifecycle.md` and `build/modeling-entities.md`
describe a "widen, then lock" schema evolution model with a partial type
hierarchy (`BYTE → SHORT → INT → LONG`, `INTEGER → [INTEGER, STRING]`).
The three-persona review flagged that this is informal vs Confluent Schema
Registry norms — `modelVersion` is referenced but never defined (when does
it increment?); compatibility classes (forward / backward / full) are not
named; historical-revision semantics under schema change are unstated;
"migrate" is named without operational meaning; renames are addressed but
deletes/deprecation are silent.

### Proposal
Produce a product spec (engineering note or design doc) that pins:

- `modelVersion` definition and increment rules
- Full widening lattice (numerics, strings, booleans, enums, dates, arrays,
  nested objects, nulls)
- Reader/writer semantics — what happens when a consumer reads a v1
  revision under a v2 schema
- A forward/backward/full-compatibility statement, or an explicit
  "we do not follow that taxonomy; here's ours"
- Operational meaning of "migrate" when a narrowing is required

### Acceptance
- [ ] Spec exists in a referenceable location
- [ ] cyoda-docs can document the rules without inventing them

---

## Issue 6 — CDC / event-out position

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `product-decision`
**Title:** Clarify product position on change-data / event-out surface

### Context
The three-persona review (data-engineer deep-dive) found **no non-gRPC,
non-processor event-out channel** anywhere in the docs — no Kafka topic,
outbox, webhook, CDC stream, NATS, SSE, or changefeed. The only option
documented is "poll REST/Trino with a watermark" or "attach a gRPC processor
to every transition and produce to Kafka yourself." Silence on this point
blocks adoption by any team running a Kafka / Debezium / Iceberg estate.

### Proposal
Make the product position explicit:

- **Option A:** Ship an outbox-via-processor recipe with delivery semantics
  (at-least-once + dedup by `requestId`, ordering guarantees, replay).
- **Option B:** State "no first-class change-data-out surface today" on the
  roadmap page, with a link to the GitHub discussion tracking it.

Either position is defensible; silence is not.

### Acceptance
- [ ] A product decision is recorded (design doc, discussion thread, or
      roadmap page)
- [ ] cyoda-docs documents the position accordingly (either the recipe or
      the gap)

---

## Issue 7 — Operational production guidance

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `documentation`
**Title:** Production operations guidance — DR, multi-region, Postgres HA, sizing

### Context
The three-persona review (platform-architect deep-dive) audited `run/`
coverage of HA, DR, backup/restore, upgrade/rollback, sizing, observability,
networking, secrets, multi-AZ, capacity planning. **DR and multi-region are
absent entirely.** PostgreSQL is drawn as a single box with no HA story
(no Patroni/CloudNativePG/RDS guidance). Backup is a four-line paragraph.
Sizing is qualitative tiers only. Observability lacks concrete metric names
or endpoint paths. These are the deal-breaker topics in a regulated-
enterprise platform review; their absence blocks adoption regardless of
concept-layer quality.

### Proposal
Produce upstream guidance that cyoda-docs can base a production-readiness
page on:

- Supported PostgreSQL HA patterns (one or two canonical recommendations)
- DR expectations and RPO/RTO targets (or a statement that these are
  operator-defined, with the levers)
- A concrete sizing model — CPU/mem requests, Postgres IOPS/WAL
  throughput, gRPC concurrency, pod-to-TPS coefficient
- Canonical metric names, health/readiness paths, trace header contract
- Multi-AZ placement guidance

### Acceptance
- [ ] An ops-guidance reference exists upstream
- [ ] cyoda-docs `run/kubernetes.md` can be rewritten against it

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

## Filing plan (once approved)

For each approved issue:

1. `gh issue create --repo <repo> --label <labels> --title <title> --body-file <extracted body>`
2. Record the resulting URL under the issue heading in this file (append `**Filed:** <url>`)
3. If relevant, update the corresponding `vendored/<area>/README.md` placeholder on this branch

Numbering is stable — issue numbering here is just for this draft, not for
GitHub issue numbers.
