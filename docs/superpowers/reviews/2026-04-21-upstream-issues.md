# Upstream issues — draft for review before filing

**Date:** 2026-04-21
**Purpose:** Drafts of 10 GitHub issues arising from the cyoda-docs
restructure pivot, the three-persona content review, and the
dropped-content audit. **Nothing here is filed yet.**

**Status:** 8 issues live; #5 **dropped** (Confluent compatibility classes
don't apply to the EDBMS model); #3 and #7 **superseded** by the
consolidated `help` surface (#9); #9 rewritten as the consolidated
upstream ask; #11 added as the docs follow-up.

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

## Issue 3 — SUPERSEDED by Issue 9

**Status:** Superseded — folded into the consolidated `cyoda help` surface
(Issue 9). The error-code catalogue ships as `cyoda help errors` (and
`cyoda help errors <code>` for drilldown), emitted in `--format text`,
`--format markdown`, and `--format json`. No separate error-catalogue
artefact is needed; the help surface delivers it.

### Original ask (retained for trail)
Canonical error-code / error-type catalogue — code, stability, meaning,
retryable-yes/no, suggested operator action.

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

## Issue 7 — SUPERSEDED by Issue 9

**Status:** Superseded — folded into the consolidated `cyoda help` surface
(Issue 9). Ops interface content ships as `cyoda help telemetry` with
drilldowns: `cyoda help telemetry metrics` (catalogue), `cyoda help
telemetry health` (endpoints), `cyoda help telemetry tracing`
(header contract), `cyoda help telemetry logs` (structured-log schema).

### Original framing (retained for trail)
A platform vendor's remit is the **interface** ops teams integrate with —
metric names, health/readiness paths, trace-context contract,
structured-log fields. *How* to run the show (Postgres HA patterns, DR
targets, sizing models, multi-AZ placement) is infrastructure- and
application-specific and is not in Cyoda's remit to prescribe. Fix the
interface; leave the playbook to the operator. That stance is
preserved inside the `help telemetry` topic tree.

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

## Issue 9 — Ship a topic-structured `cyoda help` surface covering build / run / reference

**Repo:** `Cyoda-platform/cyoda-go`
**Labels:** `cyoda-docs`, `enhancement`, `developer-experience`
**Title:** Ship a topic-structured, version-accurate `cyoda help` surface
as the canonical reference for every build, run, and reference concern

### Summary

Embed a topic-organised help system in the `cyoda` binary covering every
build/run/reference aspect of the platform. Tight, compact, precise
prose — one focused topic per concern, drilldowns where natural. Three
output formats (`text`, `markdown`, `json`). The binary becomes the
**single source of truth** for anything flag-, command-, env-var-,
metric-, endpoint-, header-, error-code-, or operation-shaped. The
cyoda-docs website becomes the narrative/visual skin on top and cites
each help topic as authoritative.

This consolidates and supersedes earlier separate asks for an error-code
catalogue (old #3) and an ops-facing interface surface (old #7).

### Why this, and why in the binary

- **Version-accurate by construction.** The help text ships with the
  binary; an operator running `v1.4.2` sees `v1.4.2` semantics, not
  whatever the website happens to have updated to.
- **AI-tool friendly.** IDE agents, code assistants, and ops copilots
  can run `cyoda help <topic> --format markdown` (or `--format json`)
  to pull authoritative, compact context into a session. No hallucination,
  no stale web search.
- **Ops-friendly.** No browser required on a locked-down production
  host. `cyoda help telemetry metrics` beats opening Confluence.
- **Docs-leverage.** Removes from cyoda-docs the burden of mirroring
  every flag, env var, metric, and error code — work that inevitably
  drifts. Docs keep the narrative, conceptual framing, diagrams, and
  worked examples; help owns the precise reference.
- **One surface, many formats.** A structured authoring model cheaply
  yields terminal text, markdown for LLM context, and JSON for tooling.

### Topic tree (proposed)

13 top-level topics. Each is a standalone page; drilldowns listed where
the content naturally subdivides. Final wording is for the cyoda-go team
to iterate — cyoda-docs will co-author where the topics cover content
already drafted on the website.

**API surfaces**
- `cyoda help openapi` — REST surface overview, auth, versioning,
  pagination conventions, error response shape
- `cyoda help grpc` — gRPC surface, CloudEvents envelope, compute-node
  protocol, streaming semantics
  - `cyoda help grpc compute` — compute-node handshake, lease model,
    request/response flow

**Operations on entities**
- `cyoda help crud` — create / read / update / delete over REST
  - `cyoda help crud transitions` — state-driven mutations, why
    `PATCH` is not the right primitive for lifecycle changes
- `cyoda help search` — query modes, predicate grammar, pagination,
  `pointTime`
  - `cyoda help search direct` — synchronous, capped result size
  - `cyoda help search async` — queued, unbounded, paged; distributed
    on the Cassandra tier (linear scaling with node count)
- `cyoda help analytics` — Trino SQL surface
  - `cyoda help analytics tables` — catalogue/schema projection rules,
    node/array decomposition, JSON table
  - `cyoda help analytics jdbc` — driver, URL template, auth

**Domain model**
- `cyoda help models` — entity model overview
  - `cyoda help models discover` — loose mode, sample-driven widening
  - `cyoda help models lock` — strict mode, reject-on-mismatch
  - `cyoda help models version` — `modelVersion` contract,
    register-new-schema flow, immutability of old revisions
  - `cyoda help models export` — `SIMPLE_VIEW` export shape, node
    descriptors, type descriptors
- `cyoda help workflows` — state-machine model overview
  - `cyoda help workflows transitions` — auto vs manual, atomicity,
    revision bump
  - `cyoda help workflows processors` — event contract, at-least-once
    delivery, idempotency expectations, dedup key
  - `cyoda help workflows criteria` — gating predicates

**Operate the binary**
- `cyoda help cli` — top-level subcommand map + conventions
  - one subtopic per subcommand (`serve`, `init`, `migrate`, …) with
    SYNOPSIS / OPTIONS / EXAMPLES
- `cyoda help config` — configuration model, precedence order (flag
  beats env beats file beats default), `_FILE` secret pattern, topic
  groupings
  - one subtopic per env-var topic group (e.g. `cyoda help config
    database`, `cyoda help config auth`, `cyoda help config grpc`)
- `cyoda help run` — deployment shapes
  - `cyoda help run docker` — single-binary / docker-compose patterns
  - `cyoda help run kubernetes` — chart layout, readiness/liveness
    wiring, rolling-upgrade posture
  - `cyoda help run desktop` — local-dev shape
- `cyoda help helm` — chart values reference, same content as rendered
  `values.yaml` docs would carry

**Ops interface surface** (supersedes old #7)
- `cyoda help telemetry` — observability interface overview
  - `cyoda help telemetry metrics` — canonical metric names, types
    (counter/gauge/histogram), labels, meaning, per-metric stability
  - `cyoda help telemetry health` — health + readiness endpoint paths,
    expected response shape, what each actually checks
  - `cyoda help telemetry tracing` — propagated headers
    (`traceparent`/`tracestate` / B3 / …), trace-id placement in
    logs, correlation contract across REST/gRPC/processor invocations
  - `cyoda help telemetry logs` — structured-log schema, key field
    names (`request_id`, `entity_id`, `transition`, …), field stability

**Error catalogue** (supersedes old #3)
- `cyoda help errors` — error model overview, RFC 7807 Problem Details
  shape, gRPC status mapping
  - `cyoda help errors <code>` — one subtopic per canonical code: what
    triggers it, retryable yes/no, suggested operator action,
    stability marker

**Onboarding**
- `cyoda help quickstart` — install, bootstrap, first entity, first
  transition

### Per-topic style template

Each topic page follows a tight `man`-page-like template. Aim: **50–150
lines of precise prose per topic.** Concept-heavy topics lean longer
(`DESCRIPTION` does more work); pure CLI/config topics lean shorter
(`OPTIONS` does the work). No marketing. No hedging.

```
NAME
    <topic>  —  <one-line purpose>

SYNOPSIS
    <invocation pattern, URL template, or API shape>

DESCRIPTION
    1–2 paragraphs of precise prose. What this is, the contract, any
    non-obvious behaviour. Zero redundancy with other topics — cross-
    reference via SEE ALSO instead of re-explaining.

OPTIONS / FIELDS
    <name>       <type>       <default>    <purpose>
    ...
    (Use this section for flag tables, env-var tables, field schemas,
     metric lists, error codes, etc. — whatever is structurally list-
     shaped for this topic.)

EXAMPLES
    # 2–3 minimal, copy-pasteable invocations

SEE ALSO
    Sibling topics, release assets (OpenAPI #1, proto #2), docs URL.

STABILITY
    stable | evolving | experimental
```

### Output formats

All topics ship in three formats. The source is a single structured
representation; each format is a renderer.

- **`--format text`** (default). Terminal-friendly: colour where
  reasonable, `less`-pipeable on long topics, boxed tables.
- **`--format markdown`**. Canonical markdown for LLM context ingestion
  and cyoda-docs import. GitHub-flavoured. Stable heading hierarchy so
  tooling can target sections.
- **`--format json`**. Structured topic descriptor:
  ```json
  {
    "topic": "search.async",
    "path": ["search", "async"],
    "name": "async — background search",
    "synopsis": "...",
    "description": "...",
    "options": [ { "name": "pointTime", "type": "RFC3339", "default": null, "purpose": "..." } ],
    "examples": [ { "title": "...", "body": "..." } ],
    "see_also": ["search", "search.direct", "analytics"],
    "stability": "stable"
  }
  ```

`cyoda help` with no args (or `cyoda help --format json`) emits the
full topic tree — path, name, one-line synopsis, stability — so tooling
can discover what is available at a given version.

### Source of truth and authoring model

- **Help text lives in cyoda-go**, as structured content alongside code.
  Concrete option: markdown files under `cmd/cyoda/help/**/*.md` with
  YAML front-matter (topic path, stability, see_also), compiled into the
  binary via `go:embed`. Alternative: Go-string content with a registry
  pattern. Either works; the contract below is what matters.
- **cyoda-docs website imports help markdown at build time** from a
  release asset (see *Release asset contract* below). Website pages
  become narrative/visual and cite their help topic; they do not
  duplicate option tables or flag lists.
- **Per-topic stability marker** (`stable` / `evolving` / `experimental`).
  Topics may be added freely. Renaming or removing a topic requires a
  deprecation window and a redirect entry for the previous path.
- **Topic-tree stability** is its own contract: additions are non-
  breaking; renames/removals require deprecation. Tooling can rely on
  topic paths being stable for the duration of a major version.

### Release asset contract

On every cyoda-go release, CI attaches two artefacts (mirrors #1 and #2):

- `help.tar.gz` — the full markdown tree, preserving topic-path
  directory structure. cyoda-docs extracts this into its build.
- `help.json` — single JSON document containing every topic descriptor
  (the `--format json` output for the full tree).

Predictable URL pattern per tag, same as #1/#2.

### Confidential tier handling

`cyoda-go-cassandra` is a separate, confidential repository.

- **OSS cyoda-go help** describes OSS/PostgreSQL-backend behaviour only.
  Where a topic has a Cassandra-tier delta (for example, distributed
  `async` search), the OSS help topic notes that the behaviour differs
  on the Cassandra-backed tier and points to Cyoda Cloud documentation.
- **Enterprise binary** (the cyoda-go build with the Cassandra backend
  linked in) carries additional subtopics and expanded content that
  replaces the OSS pointers with concrete description. Ship shape
  identical — same `cyoda help`, same formats, same release assets —
  the tree is just richer.
- **Nothing confidential leaks** into OSS help, the OSS release assets,
  or the public cyoda-docs build.

### Acceptance criteria

- [ ] `cyoda help` lists all 13 top-level topics with one-line synopses
- [ ] `cyoda help <topic>` renders the templated structure for each
      topic in the tree
- [ ] `cyoda help <topic> <subtopic>` works for every drilldown listed
      above
- [ ] All three output formats (`text`, `markdown`, `json`) produce
      equivalent content from a single source
- [ ] `cyoda help --format json` (no topic) emits the full topic-tree
      descriptor
- [ ] Per-topic `stability` marker is present in all formats
- [ ] Release CI attaches `help.tar.gz` and `help.json` as release
      assets with predictable, version-scoped URLs
- [ ] OSS build contains no confidential content; Enterprise build
      extends the OSS tree without overlapping topic paths that conflict
- [ ] Topic-tree stability contract is documented in the repo
      (additions free; renames/removals require deprecation window)

### Scoping note

This is a meaningful engineering effort — ~13 top-level topics × typical
drilldowns × ~100 lines of precise prose each = a non-trivial authoring
and tooling task. It is worth sizing as a dedicated workstream, not a
side-quest. cyoda-docs will co-author the content for topics that cover
concepts already drafted on the website (models, workflows, crud,
search, analytics), to land the first tranche quickly. The tooling
(`go:embed` + renderer + JSON descriptor + release-asset CI) can ship
before all topic content is authored; stub topics with a
`stability: experimental` marker are acceptable in the first release.

### Related

- #1 — OpenAPI as a versioned release asset (REST wire format; `help
  openapi` is the narrative companion)
- #2 — gRPC proto docs as a versioned release asset (gRPC wire format;
  `help grpc` is the narrative companion)
- #3 — SUPERSEDED by this issue
- #4 — Trino reference gaps (content lands in `help analytics`
  subtopics)
- #6 — Outbox recipe delivery semantics (feeds `help workflows
  processors`)
- #7 — SUPERSEDED by this issue
- #11 (cyoda-docs) — docs follow-up: reframe website pages around the
  help surface once the release-asset contract is in place

---

## Issue 11 — Reframe cyoda-docs around the `cyoda help` surface

**Repo:** `Cyoda-platform/cyoda-docs`
**Labels:** `documentation`, `follow-up`
**Title:** Reframe cyoda-docs pages around the `cyoda help` surface and import from release assets

### Context
Once cyoda-go ships the topic-structured `cyoda help` surface (upstream
#9) with `help.tar.gz` / `help.json` release assets, cyoda-docs should
stop mirroring reference content and instead become the narrative +
visual skin on top.

### Proposal

1. **Import pipeline.** Add a build-pipeline step that fetches
   `help.tar.gz` for the pinned cyoda-go release and extracts it under
   `src/content/vendored/help/**`. Treat imported markdown as vendored
   (gitignored-per-build, regenerated). Mirrors the schema-pages
   generator pattern.
2. **Per-page help callout.** Every website page that maps to one or
   more help topics carries a "From the binary" callout at the top:
   > Canonical reference: `cyoda help <topic>`. This page is the
   > narrative; the binary is authoritative.
3. **Reference pages become navigators.** `reference/cli.mdx`,
   `reference/configuration.mdx`, `reference/helm.mdx` become thin
   navigator/concept pages: enumerate topics, explain the model
   (precedence rules, `_FILE` secrets, chart layout), link to the
   help topic for the authoritative list. Drop the `awaiting-upstream`
   banners.
4. **Run pages stop mirroring flags.** `run/docker.md`,
   `run/kubernetes.md`, `run/desktop.md` stay conceptual (when-it-fits,
   deployment shape, HA posture). Any flag/value concern points at the
   help topic.
5. **Build pages cite their operation topic.** `working-with-entities`
   → `help crud` + `help search`; `analytics-with-sql` → `help
   analytics`; `workflows-and-processors` → `help workflows`; etc.
6. **Dead-anchor cleanup.** Anchors like `/reference/api/#search` (flagged
   in the three-persona review) get retargeted at the relevant help
   topic or the new Build-side page (see #10).

### Acceptance
- [ ] Build pipeline imports help content from a pinned cyoda-go release
- [ ] All three `awaiting-upstream` stub pages reframed as navigators
      and their banners dropped
- [ ] Every website page that has a help-topic counterpart carries the
      "From the binary" callout
- [ ] Review-doc ranked-fix-list item 7 marked complete (awaiting-
      upstream inlining resolved structurally rather than by hand-port)

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
