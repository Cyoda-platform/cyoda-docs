# Storage engines overview page — design

**Date:** 2026-04-28
**Status:** Draft for review
**Owner:** Paul

## 1. Goal

Add a single, contract-led overview page documenting the five "varieties" of Cyoda runtime that share the same application contract:

- `cyoda-go` with the **in-memory** plugin
- `cyoda-go` with the **SQLite** plugin
- `cyoda-go` with the **PostgreSQL** plugin
- `cyoda-go` with the **Cassandra** plugin (commercial)
- The classic **CPL / Kotlin** runtime that has powered Cyoda Cloud in production since 2017 (Cassandra-backed)

The page is part of the developer/architect/operator docs for `cyoda-go`. It is not a sales surface — Cyoda Cloud is mentioned as the natural next step for organisations that want Cyoda as a service, in factual language and without licensing CTAs. A dedicated commercial site (`cyoda.org`) and the existing `cyoda.com` cover that role.

## 2. Audience and framing

- **Primary**: developers and operators evaluating where to run `cyoda-go`, and architects choosing a deployment shape.
- **Secondary**: existing Cyoda users following the cross-link from the landing page's *Four storage engines. One application contract.* section.

Framing is **contract-led**: the parity guarantee (Snapshot Isolation with First-Committer-Wins on entity-level conflicts — SI+FCW) is the lede, because it's what makes "five engines" interesting rather than just "we support multiple databases." Per-engine sections then describe operational characteristics and best-fit scope. A "Choosing an engine" section closes the page with qualitative decision content.

## 3. Information architecture

### 3.1 New page location

`src/content/docs/run/storage-engines.mdx`, slotted in the **Run** sidebar group between `run/index.mdx` and `run/desktop.mdx`. Ordering controlled via Starlight `sidebar: { order: N }` frontmatter; explicit orders set on the existing `run/*` pages as needed to lock the sequence:

```
Run
├── Overview        (run/index.mdx)
├── Storage engines (run/storage-engines.mdx)   ← NEW
├── Desktop         (run/desktop.mdx)
├── Docker          (run/docker.md)
└── Kubernetes      (run/kubernetes.md)
```

### 3.2 Sidebar reorg — Cyoda Cloud promoted to top-level

Cyoda Cloud is moved out of `run/` and becomes a top-level sidebar group, positioned **between Run and Reference**:

- `git mv src/content/docs/run/cyoda-cloud/ src/content/docs/cyoda-cloud/`
- New sidebar entry in `astro.config.mjs`:
  ```js
  { label: 'Cyoda Cloud', collapsed: true, autogenerate: { directory: 'cyoda-cloud' } }
  ```
  inserted between the existing `Run` and `Reference` entries.
- Final top-level order: Getting Started · Concepts · Build · Run · **Cyoda Cloud** · Reference.

**Inbound link patches** (each verified by a build, since Astro/Starlight fails on broken internal links):

- `src/content/docs/index.mdx` — the *Where to go next* "Running one?" bullet currently lists `cyoda-cloud` as a Run sub-link. Drop that sub-link from the Run bullet and add a separate bullet pointing to `/cyoda-cloud/` (e.g. *"Need it managed? See [Cyoda Cloud](/cyoda-cloud/)"*).
- `src/content/docs/concepts/authentication-and-identity.md` — update its `/run/cyoda-cloud/...` link target to `/cyoda-cloud/...`.
- `astro.config.mjs` — only the new sidebar entry; no other config changes.
- `tests/` — grep for `cyoda-cloud`; if any Playwright assertion targets the old path, update it to the new path.

### 3.3 Cross-references added by this PR

- `src/content/docs/index.mdx` — the existing *Four storage engines. One application contract.* section gets a link pointing to the new page (e.g. *"→ See [Storage engines](/run/storage-engines/)"* below the prose).
- `src/content/docs/concepts/what-is-cyoda.mdx` — one-line cross-link to the new page in a sensible location (e.g. near the discussion of runtime/deployment).

### 3.4 Out of scope for this PR

- Restructuring the `cyoda-cloud/` sub-pages' content beyond the directory move + sidebar entry.
- Restructuring the `run/index.mdx` content beyond fixing the inbound `cyoda-cloud` reference.
- Any benchmarks page. Numeric throughput / scale numbers stay off this page until measured with documented methodology.

## 4. Page content outline

`src/content/docs/run/storage-engines.mdx`, target length ~1500–2200 words.

### 4.1 Frontmatter

```yaml
---
title: Storage engines
description: Five ways to run Cyoda — one application contract.
sidebar:
  order: 1
---
```

(Adjacent `run/*` pages get `sidebar.order` values to lock the sequence in §3.1.)

### 4.2 Sections

**1. Lede (~80 words).** One paragraph: `cyoda-go` ships with a pluggable storage SPI; the same application code runs unchanged across four engines, plus the classic CPL/Kotlin runtime that powers Cyoda Cloud. The interesting part is parity — your transactional contract is identical across them.

**2. One application contract (~250 words).** Explains SI+FCW in operator/developer terms: what callers can rely on (snapshot reads, entity-level conflict detection at commit, first-committer-wins on write/write conflicts), what they cannot (no phantom/predicate protection — link to the operational rule documented for workflow authors). States explicitly that this contract is identical across all five varieties.

**3. At a glance — comparison matrix.** ~120 words of framing around the table below. The table is the page's scan-anchor.

| Engine | Durability | Fault tolerance | Scale envelope | Footprint | Distribution | Best-fit scope |
|---|---|---|---|---|---|---|
| **In-memory** | Ephemeral | None — restart loses data | Bounded by host RAM | Single binary, no deps | OSS — ships with cyoda-go | Tests, digital-twin sims |
| **SQLite** | Durable (single file) | Single-process; data survives restart, not disk loss | Single node, disk-bound | Single binary, no deps | OSS — ships with cyoda-go | Desktop, edge, single-node prod |
| **PostgreSQL** | Durable, replicated via PostgreSQL | HA via PostgreSQL replication & failover; mid-transaction node loss returns `TRANSACTION_NODE_UNAVAILABLE` (client retries) | Multi-node stateless cluster; writes bounded by single PG primary | cyoda-go nodes + PostgreSQL 14+ (managed or self-hosted) | OSS — ships with cyoda-go | Multi-node production; audit / compliance |
| **Cassandra** | Durable, replicated via Cassandra | Cluster-tolerant; transactions survive mid-flight node loss (no `TRANSACTION_NODE_UNAVAILABLE`) | Horizontal write scale-out, multi-cluster | cyoda-go nodes + Cassandra + Redpanda | Commercial — contact Cyoda | Write-heavy scale-out; HA without retry-on-node-loss |
| **CPL / Classic** | Durable, replicated via Cassandra | Production-hardened since 2017; Cassandra-backed HA | Horizontal scale-out (Cassandra-backed); managed by Cyoda | None on your side | Managed service — Cyoda Cloud | Consume Cyoda as a service |

Caption notes: all five share the same SI+FCW application contract; *Distribution* describes how you obtain the engine (OSS in repo / commercial license / managed service), not uptime.

**4. Per-engine sections** (~200–300 words each).

- **In-memory.** Ephemeral, microsecond-class transactions, single process. Use for tests and digital-twin simulations. Explicitly not for production where restart would lose data.
- **SQLite.** Durable single-node; embedded WASM driver (no CGO); single-process flock for safety. Best for desktop, edge, containerised single-node production. Note: NFS not supported.
- **PostgreSQL.** Durable, multi-node stateless cluster behind a load balancer; works with any managed PostgreSQL (RDS, Cloud SQL, Azure Database, Supabase, Neon, Aiven, …) or self-hosted PG 14+. Cluster discovery via gossip — no ZooKeeper, etcd, or Kafka. Writes bounded by the single PG primary (qualitative; no numeric throughput claims). Document the `TRANSACTION_NODE_UNAVAILABLE` mid-transaction failure mode as an explicit, accepted trade-off and describe what client retry looks like.
- **Cassandra (commercial).** Horizontal write scale-out without a single-primary bottleneck; transactions survive mid-flight node loss, so the `TRANSACTION_NODE_UNAVAILABLE` failure mode does not exist. State the anti-pattern explicitly: entities updated thousands of times per day are not supported (this is a load-bearing licensing-relevant fact, not sales language). Include one sentence noting that the storage layer powering this plugin is the same lineage that has run CPL/Cyoda Cloud in production since 2017 — operational provenance, not a pitch. Soft pointer: *"available commercially — contact Cyoda."*
- **CPL / Classic (Cyoda Cloud).** Opener: *"The classic Kotlin/Java runtime that has powered Cyoda Cloud in production with clients since 2017, on a Cassandra storage backend. `cyoda-go` is an adaptation of the EDBMS design that emerged from CPL."* Cross-link to the new top-level Cyoda Cloud section for managed-service details.

**5. Choosing an engine (~250 words).** Plain-English decision content (not a flowchart):

- Local dev / tests → in-memory
- Desktop / edge / single-node prod → SQLite
- Multi-node prod, audit/compliance → PostgreSQL
- Write-throughput exceeds single-PG-primary capacity, or you need HA without `TRANSACTION_NODE_UNAVAILABLE` → Cassandra
- Don't want to run any of it → Cyoda Cloud

Includes a short *When to switch* subsection with qualitative directions only (write throughput ceiling, scale-out ceiling, plugin fit gap). No node-count thresholds, no writes/sec figures.

**6. Footer cross-references (~40 words).** Concepts → EDBMS, *What is Cyoda*. Reference → CLI / Configuration env vars per engine. Cyoda Cloud → top-level section.

### 4.3 Confidentiality boundary

The cyoda-go-cassandra codebase is confidential, but its operational characteristics are public. The page may state:

- Horizontal write scale-out, no single-primary bottleneck.
- Transactions survive node loss; no `TRANSACTION_NODE_UNAVAILABLE`.
- Anti-pattern: entities updated thousands of times per day are not supported.
- Footprint: Cassandra cluster + Redpanda + cyoda-go nodes; multi-DC capable.

The page must NOT include:

- Cassandra schema/table layouts.
- Internal coordination mechanism (shard ownership, transaction coordination internals).
- Any content that reproduces material from `CASSANDRA_BACKEND_DESIGN.md` beyond the operational characteristics above.

### 4.4 Numeric content policy

No quantitative throughput, latency, or cluster-size numbers are published on this page. Existing internal estimates (e.g. "50–200 entity creates/s/node", "≤10 nodes") are finger-in-the-air figures; they remain in internal docs only. When measured benchmarks exist with documented methodology, they earn their own page (likely under `reference/`) and this page links to it.

## 5. Build, test, and integration

### 5.1 Build pipeline

The page is hand-written MDX. No code changes to the build pipeline:

- `scripts/generate-schema-pages.js` — not touched.
- `scripts/fetch-cyoda-help-index.js` — not touched (no `<FromTheBinary>` references planned).
- `scripts/export-markdown.js` — picks up the new page automatically; emits `dist/markdown/run/storage-engines.md` for the *Copy page* button.
- `scripts/generate-llms-txt.js` — picks up the new page automatically.
- `scripts/package-schemas.js` — not affected.

### 5.2 Tests

- **Astro/Starlight build** is the primary integration test: it fails on broken internal links, which catches the inbound-link patching from the Cyoda Cloud move.
- **Playwright suite** is content-agnostic for this change. Risk: navigator tests with hard-coded selectors. Implementation step: grep `tests/` for `cyoda-cloud` and update any URL references after the move.
- **Manual QA**:
  - Visual scan in `npm run dev` at the working breakpoints (~1100, ~600, ~380 px).
  - Click-through: landing page *Four storage engines. One application contract.* link → new page.
  - Click-through: `concepts/what-is-cyoda` cross-link → new page.
  - Click-through: any old `/run/cyoda-cloud/...` reference resolves under `/cyoda-cloud/...`.
  - Sidebar visually shows: Getting Started · Concepts · Build · Run · Cyoda Cloud · Reference.

## 6. Risks and mitigations

- **Risk**: claiming engine characteristics that drift as `cyoda-go` evolves.
  **Mitigation**: keep claims qualitative, link to `cyoda-go` source-of-truth docs (PRD / ARCHITECTURE / CONSISTENCY) rather than restating internals.
- **Risk**: leaking confidential Cassandra internals.
  **Mitigation**: explicit boundary in §4.3; reviewer (Paul) checks before merge.
- **Risk**: inbound-link breakage from Cyoda Cloud move.
  **Mitigation**: Astro/Starlight build fails on broken links; manual QA list in §5.2.
- **Risk**: Playwright tests reference old `/run/cyoda-cloud/` path.
  **Mitigation**: explicit grep step in implementation plan; tests updated as part of the same PR.
- **Risk**: page reads as a sales pitch, conflicting with the docs-not-commercial framing.
  **Mitigation**: factual language; "commercial — contact Cyoda" appears as availability metadata in the matrix and as a single non-promotional line in the Cassandra section. No CTAs, no benefits language.

## 7. Acceptance criteria

- [ ] `src/content/docs/run/storage-engines.mdx` exists and renders.
- [ ] The Run sidebar group lists Storage engines between Overview and Desktop.
- [ ] `src/content/docs/cyoda-cloud/` exists; `src/content/docs/run/cyoda-cloud/` is removed.
- [ ] Top-level sidebar order is: Getting Started · Concepts · Build · Run · Cyoda Cloud · Reference.
- [ ] Landing page's *Four storage engines* section links to the new page.
- [ ] `concepts/what-is-cyoda.mdx` links to the new page.
- [ ] All inbound `/run/cyoda-cloud/...` links updated to `/cyoda-cloud/...`.
- [ ] `npm run build` passes with no broken-link errors.
- [ ] `npm test` passes (Playwright + node:test), with any path-update edits to existing tests included.
- [ ] No quantitative throughput / latency / cluster-size numbers appear on the new page.
- [ ] No Cassandra-internal design content (schema, coordination, table layout) appears on the new page.
