# Storage Engines Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single contract-led overview page at `src/content/docs/run/storage-engines.mdx` documenting the five Cyoda runtime varieties, and promote Cyoda Cloud to a top-level sidebar section by moving its sub-tree out of `run/`.

**Architecture:** Hand-written MDX page using existing Starlight conventions; no new components, no generator changes. The Cyoda Cloud directory move triggers redirect, test, and inbound-link updates. Each task is a small atomic change with its own commit; the build's broken-link checker is the primary integration test.

**Tech Stack:** Astro + Starlight (existing), MDX, Playwright (existing test suite). No new dependencies.

**Branch:** `docs/storage-engines-page` (already created and checked out, based off `origin/main`). Spec lives at `docs/superpowers/specs/2026-04-28-storage-engines-page-design.md`.

---

## File Map

**New files:**
- `src/content/docs/run/storage-engines.mdx` — the new overview page

**Moved files (git mv):**
- `src/content/docs/run/cyoda-cloud/` → `src/content/docs/cyoda-cloud/` (4 files: `index.mdx`, `identity-and-entitlements.md`, `provisioning.mdx`, `status-and-roadmap.md`)

**Modified files:**
- `astro.config.mjs` — add Cyoda Cloud sidebar entry; update 8 redirect targets
- `tests/redirects.spec.ts` — update 8 redirect-target assertions
- `src/content/docs/index.mdx` — landing page: add cross-link in "Four storage engines" section; restructure the "Running one?" / "Need it managed?" navigation bullets
- `src/content/docs/concepts/what-is-cyoda.mdx` — add cross-link to the new page
- `src/content/docs/concepts/authentication-and-identity.md` — repoint `/run/cyoda-cloud/...` link to `/cyoda-cloud/...`
- `src/content/docs/run/index.mdx` — add a one-line pointer to the new page; repoint relative `./cyoda-cloud/` link

---

## Task 1: Verify clean baseline

Before changes, confirm the branch is in a buildable state and the test suite passes. This is the reference point everything is compared against.

**Files:** none modified.

- [ ] **Step 1: Confirm branch and clean tree**

```bash
git branch --show-current
git status --short
```

Expected: branch is `docs/storage-engines-page`. Untracked files (`.worktrees/`, `*.png` screenshots, `src/content/docs/schemas/`) are pre-existing and not relevant.

- [ ] **Step 2: Baseline build**

```bash
npm run build
```

Expected: build succeeds. Note the line count / link count summary so deltas are visible later.

- [ ] **Step 3: Baseline tests**

```bash
GA_MEASUREMENT_ID=G-TEST npm test
```

Expected: all tests pass (Playwright + node:test). If anything fails on baseline, **stop** — do not begin the change until baseline is green.

---

## Task 2: Move `cyoda-cloud/` out of `run/`

Promote Cyoda Cloud to a top-level docs section by relocating its directory. This task does the move only — sidebar wiring and link patching are separate tasks so each commit is reviewable on its own.

**Files:**
- Move: `src/content/docs/run/cyoda-cloud/` → `src/content/docs/cyoda-cloud/` (4 files)

- [ ] **Step 1: Verify source layout**

```bash
ls src/content/docs/run/cyoda-cloud/
```

Expected: `identity-and-entitlements.md  index.mdx  provisioning.mdx  status-and-roadmap.md`

- [ ] **Step 2: Move the directory**

```bash
git mv src/content/docs/run/cyoda-cloud src/content/docs/cyoda-cloud
```

- [ ] **Step 3: Verify destination**

```bash
ls src/content/docs/cyoda-cloud/
test ! -d src/content/docs/run/cyoda-cloud && echo "old path gone"
```

Expected: `identity-and-entitlements.md  index.mdx  provisioning.mdx  status-and-roadmap.md` and `old path gone`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(docs): move cyoda-cloud out of run subtree

Promotes Cyoda Cloud from a child of Run to a top-level docs section.
Sidebar wiring, redirects, and inbound link patches follow in
subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Cyoda Cloud sidebar entry between Run and Reference

Wire the relocated directory into Starlight's sidebar so it renders as its own top-level group.

**Files:**
- Modify: `astro.config.mjs` (sidebar block, ~line 36–55)

- [ ] **Step 1: Inspect current sidebar block**

```bash
grep -n "sidebar:" astro.config.mjs
```

Expected: a single `sidebar:` key with five entries (Getting Started, Concepts, Build, Run, Reference).

- [ ] **Step 2: Insert Cyoda Cloud entry between Run and Reference**

Edit `astro.config.mjs`. The sidebar array currently ends:

```js
				{
					label: 'Run',
					collapsed: true,
					autogenerate: { directory: 'run' }
				},
				{
					label: 'Reference',
					collapsed: true,
					autogenerate: { directory: 'reference' }
				},
			],
```

Change to:

```js
				{
					label: 'Run',
					collapsed: true,
					autogenerate: { directory: 'run' }
				},
				{
					label: 'Cyoda Cloud',
					collapsed: true,
					autogenerate: { directory: 'cyoda-cloud' }
				},
				{
					label: 'Reference',
					collapsed: true,
					autogenerate: { directory: 'reference' }
				},
			],
```

- [ ] **Step 3: Build to verify the new section renders**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds. Build will fail with broken-link errors for any link still pointing at `/run/cyoda-cloud/...` — that is expected; those are fixed in Tasks 4–6.

If the build fails for *other* reasons (sidebar parse error, syntax error in `astro.config.mjs`), fix before proceeding.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
chore(sidebar): promote Cyoda Cloud to top-level

Adds a Cyoda Cloud sidebar entry between Run and Reference,
auto-generated from src/content/docs/cyoda-cloud/.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update redirects to point at new Cyoda Cloud paths

Eight static redirects in `astro.config.mjs` currently send legacy URLs to `/run/cyoda-cloud/...`. Repoint them to `/cyoda-cloud/...`.

**Files:**
- Modify: `astro.config.mjs` (redirects block, lines 64–82)

- [ ] **Step 1: Identify the eight entries**

```bash
grep -n "run/cyoda-cloud" astro.config.mjs
```

Expected: 8 matches at lines 70, 71, 76, 77, 78, 79, 80, 81 (line numbers may shift slightly after Task 3).

- [ ] **Step 2: Replace `/run/cyoda-cloud/` with `/cyoda-cloud/` across all eight values**

Apply this replacement (the keys stay unchanged; only the values change):

```diff
-		'/guides/iam-jwt-keys-and-oidc/': '/run/cyoda-cloud/identity-and-entitlements/',
-		'/guides/iam-oidc-and-jwt-claims/': '/run/cyoda-cloud/identity-and-entitlements/',
+		'/guides/iam-jwt-keys-and-oidc/': '/cyoda-cloud/identity-and-entitlements/',
+		'/guides/iam-oidc-and-jwt-claims/': '/cyoda-cloud/identity-and-entitlements/',
...
-		'/guides/provision-environment/': '/run/cyoda-cloud/provisioning/',
-		'/architecture/cyoda-cloud-architecture/': '/run/cyoda-cloud/',
-		'/cloud/entitlements/': '/run/cyoda-cloud/identity-and-entitlements/',
-		'/cloud/roadmap/': '/run/cyoda-cloud/status-and-roadmap/',
-		'/cloud/service-details/': '/run/cyoda-cloud/',
-		'/cloud/status/': '/run/cyoda-cloud/status-and-roadmap/',
+		'/guides/provision-environment/': '/cyoda-cloud/provisioning/',
+		'/architecture/cyoda-cloud-architecture/': '/cyoda-cloud/',
+		'/cloud/entitlements/': '/cyoda-cloud/identity-and-entitlements/',
+		'/cloud/roadmap/': '/cyoda-cloud/status-and-roadmap/',
+		'/cloud/service-details/': '/cyoda-cloud/',
+		'/cloud/status/': '/cyoda-cloud/status-and-roadmap/',
```

- [ ] **Step 3: Verify no occurrences remain**

```bash
grep -n "run/cyoda-cloud" astro.config.mjs
```

Expected: no output (zero matches).

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
fix(redirects): repoint cyoda-cloud redirects to top-level path

Updates the eight static redirects that previously sent legacy URLs
to /run/cyoda-cloud/... so they now resolve to /cyoda-cloud/...
following the directory move.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update redirect tests

`tests/redirects.spec.ts` mirrors the redirect map from `astro.config.mjs`. Update the eight assertions to match the new targets.

**Files:**
- Modify: `tests/redirects.spec.ts` (lines 9–20)

- [ ] **Step 1: Identify the matching assertions**

```bash
grep -n "run/cyoda-cloud" tests/redirects.spec.ts
```

Expected: 8 matches at lines 9, 10, 15, 16, 17, 18, 19, 20.

- [ ] **Step 2: Replace `/run/cyoda-cloud/` with `/cyoda-cloud/` across all eight tuples**

Apply this replacement:

```diff
-  ['/guides/iam-jwt-keys-and-oidc/', '/run/cyoda-cloud/identity-and-entitlements/'],
-  ['/guides/iam-oidc-and-jwt-claims/', '/run/cyoda-cloud/identity-and-entitlements/'],
+  ['/guides/iam-jwt-keys-and-oidc/', '/cyoda-cloud/identity-and-entitlements/'],
+  ['/guides/iam-oidc-and-jwt-claims/', '/cyoda-cloud/identity-and-entitlements/'],
...
-  ['/guides/provision-environment/', '/run/cyoda-cloud/provisioning/'],
-  ['/architecture/cyoda-cloud-architecture/', '/run/cyoda-cloud/'],
-  ['/cloud/entitlements/', '/run/cyoda-cloud/identity-and-entitlements/'],
-  ['/cloud/roadmap/', '/run/cyoda-cloud/status-and-roadmap/'],
-  ['/cloud/service-details/', '/run/cyoda-cloud/'],
-  ['/cloud/status/', '/run/cyoda-cloud/status-and-roadmap/'],
+  ['/guides/provision-environment/', '/cyoda-cloud/provisioning/'],
+  ['/architecture/cyoda-cloud-architecture/', '/cyoda-cloud/'],
+  ['/cloud/entitlements/', '/cyoda-cloud/identity-and-entitlements/'],
+  ['/cloud/roadmap/', '/cyoda-cloud/status-and-roadmap/'],
+  ['/cloud/service-details/', '/cyoda-cloud/'],
+  ['/cloud/status/', '/cyoda-cloud/status-and-roadmap/'],
```

- [ ] **Step 3: Verify no occurrences remain**

```bash
grep -n "run/cyoda-cloud" tests/redirects.spec.ts
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add tests/redirects.spec.ts
git commit -m "$(cat <<'EOF'
test(redirects): update cyoda-cloud target assertions

Mirrors the redirect-target updates in astro.config.mjs so the
Playwright redirect tests verify the new /cyoda-cloud/... paths.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Patch inbound links to the moved directory

Three files reference `/run/cyoda-cloud/...` (or the relative `./cyoda-cloud/`) outside of redirects. Update each.

**Files:**
- Modify: `src/content/docs/index.mdx` (line ~45)
- Modify: `src/content/docs/concepts/authentication-and-identity.md` (line ~69)
- Modify: `src/content/docs/run/index.mdx` (lines ~20, ~34)

- [ ] **Step 1: Confirm the inbound references**

```bash
grep -rn "run/cyoda-cloud\|cyoda-cloud/" src/content/docs/ | grep -v "^src/content/docs/cyoda-cloud/"
```

Expected (line numbers approximate):
- `src/content/docs/index.mdx:45:- **Running one?** [Run](/run/) covers [desktop](/run/desktop/), [Docker](/run/docker/), [Kubernetes](/run/kubernetes/), and [Cyoda Cloud](/run/cyoda-cloud/).`
- `src/content/docs/concepts/authentication-and-identity.md:69:  [Run → Cyoda Cloud → identity and entitlements](/run/cyoda-cloud/identity-and-entitlements/).`
- `src/content/docs/run/index.mdx:20: | **Cyoda Cloud**  ...`
- `src/content/docs/run/index.mdx:34: - **[Cyoda Cloud](./cyoda-cloud/)** — a managed service backed by Cassandra. ...`

- [ ] **Step 2: Update `src/content/docs/index.mdx`**

Find the existing bullet at line ~45:

```markdown
- **Running one?** [Run](/run/) covers [desktop](/run/desktop/), [Docker](/run/docker/), [Kubernetes](/run/kubernetes/), and [Cyoda Cloud](/run/cyoda-cloud/).
```

Replace with two bullets — drop Cyoda Cloud from the Run list, add a separate bullet:

```markdown
- **Running one?** [Run](/run/) covers [desktop](/run/desktop/), [Docker](/run/docker/), and [Kubernetes](/run/kubernetes/).
- **Need it managed?** [Cyoda Cloud](/cyoda-cloud/) is the hosted offering.
```

- [ ] **Step 3: Update `src/content/docs/concepts/authentication-and-identity.md`**

At line ~69, replace:

```markdown
[Run → Cyoda Cloud → identity and entitlements](/run/cyoda-cloud/identity-and-entitlements/).
```

with:

```markdown
[Cyoda Cloud → identity and entitlements](/cyoda-cloud/identity-and-entitlements/).
```

- [ ] **Step 4: Update `src/content/docs/run/index.mdx`**

The "Pick your packaging" matrix still references **Cyoda Cloud** as a *packaging* row — that framing remains correct: Cyoda Cloud is a way to consume Cyoda regardless of where it lives in the sidebar. **Leave the row label unchanged.**

The bullet at line ~34 currently reads:

```markdown
- **[Cyoda Cloud](./cyoda-cloud/)** — a managed service backed by
  Cassandra. Right when you need enterprise-grade identity, multi-tenancy,
  and provisioning, and you do not want to operate the infrastructure.
```

Replace the relative link target — `./cyoda-cloud/` no longer resolves from `run/`:

```markdown
- **[Cyoda Cloud](/cyoda-cloud/)** — a managed service backed by
  Cassandra. Right when you need enterprise-grade identity, multi-tenancy,
  and provisioning, and you do not want to operate the infrastructure.
```

- [ ] **Step 5: Verify no `/run/cyoda-cloud/` or `./cyoda-cloud/` references remain in human content**

```bash
grep -rn "run/cyoda-cloud\|\./cyoda-cloud/" src/content/docs/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/content/docs/index.mdx src/content/docs/concepts/authentication-and-identity.md src/content/docs/run/index.mdx
git commit -m "$(cat <<'EOF'
fix(links): repoint inbound cyoda-cloud references

Updates the three remaining inbound links that pointed at the old
/run/cyoda-cloud/ path (or the relative ./cyoda-cloud/ from run/index)
so they resolve to the new top-level /cyoda-cloud/ section. Splits
the landing page's Run/Cyoda Cloud bullet into two so the navigation
matches the new sidebar layout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Verify build is green after the move

Checkpoint: confirm the directory move + sidebar wiring + redirect/test/link updates produce a clean build before adding new content. This catches regressions early.

**Files:** none modified.

- [ ] **Step 1: Run build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds. No broken-link errors. Sidebar prints with six top-level groups (Getting Started, Concepts, Build, Run, Cyoda Cloud, Reference).

- [ ] **Step 2: Run tests**

```bash
GA_MEASUREMENT_ID=G-TEST npm test
```

Expected: all tests pass, including the eight redirect assertions now targeting `/cyoda-cloud/...`.

- [ ] **Step 3: Manual sidebar spot-check**

```bash
npm run dev
```

Open http://localhost:4321 in a browser. Confirm:
- Sidebar shows: Getting Started · Concepts · Build · Run · **Cyoda Cloud** · Reference (in that order)
- The Cyoda Cloud group expands to show: index, identity-and-entitlements, provisioning, status-and-roadmap
- The Run group no longer contains a `cyoda-cloud` child
- The landing page's "Where to go next" now has a separate "Need it managed?" bullet

Stop the dev server. Do **not** commit anything in this task — it is a verification checkpoint.

---

## Task 8: Create the storage engines page

Add the new contract-led overview page. Content is drawn from the spec's §4 outline and approved comparison matrix; no quantitative numbers, no Cassandra-internal design.

**Files:**
- Create: `src/content/docs/run/storage-engines.mdx`

- [ ] **Step 1: Write the page**

Create `src/content/docs/run/storage-engines.mdx` with the following exact contents:

````mdx
---
title: Storage engines
description: Five ways to run Cyoda — one application contract.
sidebar:
  order: 5
---

Cyoda runs on five storage configurations: four pluggable engines that
ship with `cyoda-go` (in-memory, SQLite, PostgreSQL, and a commercial
Cassandra plugin) plus the classic Kotlin runtime that has powered Cyoda
Cloud in production since 2017. They differ in durability, fault
tolerance, and operational footprint — but the **application contract
is identical across all five.** Code written against one runs unchanged
against any other.

## One application contract

Every Cyoda runtime offers the same isolation contract: **Snapshot
Isolation with First-Committer-Wins on entity-level conflicts** (SI+FCW).

What that gets you:

- **Snapshot reads** — a transaction sees a consistent point-in-time
  view of the data, regardless of concurrent writes.
- **Entity-level conflict detection at commit** — if another transaction
  modified an entity you read or wrote, your transaction aborts at
  commit and you retry.
- **First-committer-wins on write/write conflicts** — concurrent updates
  to the same entity resolve deterministically; the second commit
  aborts.

What it does **not** give you:

- **No phantom or predicate protection.** A transaction that counts
  rows matching a predicate cannot rely on the count being stable
  across the transaction's lifetime. Workflow logic that needs
  predicate-stable counts has to be expressed as an explicit
  serialization point — see the operational rule for workflow authors
  in [Concepts → Entities and lifecycle](/concepts/entities-and-lifecycle/).

The contract is delivered identically by every engine. cyoda-go's
in-memory and SQLite plugins implement SI+FCW in process. The
PostgreSQL plugin layers it on PostgreSQL `REPEATABLE READ`. The
Cassandra plugin and the classic CPL runtime implement it against
Cassandra primitives. The application has no way to tell which engine
it is running against — and that is the point.

## At a glance

| Engine | Durability | Fault tolerance | Scale envelope | Footprint | Distribution | Best-fit scope |
|---|---|---|---|---|---|---|
| **In-memory** | Ephemeral | None — restart loses data | Bounded by host RAM | Single binary, no deps | OSS — ships with cyoda-go | Tests, digital-twin sims |
| **SQLite** | Durable (single file) | Single-process; survives restart, not disk loss | Single node, disk-bound | Single binary, no deps | OSS — ships with cyoda-go | Desktop, edge, single-node prod |
| **PostgreSQL** | Durable, replicated via PostgreSQL | HA via PostgreSQL replication & failover; mid-transaction node loss returns `TRANSACTION_NODE_UNAVAILABLE` (client retries) | Multi-node stateless cluster; writes bounded by single PG primary | cyoda-go nodes + PostgreSQL 14+ (managed or self-hosted) | OSS — ships with cyoda-go | Multi-node production; audit / compliance |
| **Cassandra** | Durable, replicated via Cassandra | Cluster-tolerant; transactions survive mid-flight node loss (no `TRANSACTION_NODE_UNAVAILABLE`) | Horizontal write scale-out, multi-cluster | cyoda-go nodes + Cassandra + Redpanda | Commercial — Enterprise edition or via Cyoda Cloud | Write-heavy scale-out; HA without retry-on-node-loss |
| **CPL / Classic** | Durable, replicated via Cassandra | Production-hardened since 2017; Cassandra-backed HA | Horizontal scale-out (Cassandra-backed); managed by Cyoda | None on your side | Managed service — Cyoda Cloud | Consume Cyoda as a service |

All five share the same SI+FCW application contract. *Distribution*
describes how you obtain the engine — open source in the cyoda-go repo,
commercial license, or managed service — not uptime or fault tolerance.

## In-memory

The in-memory plugin keeps all entity state in process memory.
Transactions complete in microseconds; there are no I/O paths and no
external dependencies. State is lost when the process exits.

It is the right choice for tests and for digital-twin simulations where
durability is delegated to a snapshot mechanism elsewhere. It is **not**
appropriate for any deployment where data must survive a restart.

A single process owns the store; there is no way to share in-memory
state across processes. Memory consumption is bounded by host RAM.

## SQLite

The SQLite plugin gives you durable single-node storage with the same
zero-dependency footprint as in-memory: a single `cyoda-go` binary, a
single database file, no other moving parts. The driver is a pure-Go
WASM build of SQLite — no CGO, clean cross-compilation.

SQLite provides only database-level write locking; entity-level
conflict detection (SI+FCW) is layered on top by `cyoda-go`. The
running process holds an exclusive `flock` on the database file for its
entire lifetime, so a second `cyoda-go` against the same file fails
fast at startup with a clear error. Two processes sharing a file would
have independent SI+FCW state and silently corrupt each other.

Best-fit deployments: desktop applications, edge devices, containerised
single-node production. The combination of "must survive restart" and
"single process is enough" lands here.

**Not** suitable for NFS-mounted database files (SQLite itself is
unreliable on NFS), nor for any deployment that needs more than one
`cyoda-go` process against the same data. If either of those applies,
move to PostgreSQL.

## PostgreSQL

The PostgreSQL plugin is `cyoda-go`'s production multi-node tier. A
small cluster of stateless `cyoda-go` nodes — typical deployments run a
handful — sits behind a load balancer with PostgreSQL as the only
stateful dependency. Cluster discovery is gossip-based (HashiCorp
memberlist, embedded, pure Go); there is no ZooKeeper, etcd, or Kafka
to operate.

PostgreSQL 14 or later is required. The plugin works with any managed
PostgreSQL platform — RDS, Cloud SQL, Azure Database, Supabase, Neon,
Aiven — or with self-hosted PostgreSQL. SI+FCW is implemented as
PostgreSQL `REPEATABLE READ` plus an application-layer first-committer
validation at commit time. Tenant isolation is enforced via PostgreSQL
Row-Level Security as defense-in-depth: even an application-layer bug
in tenant scoping cannot leak data across tenants.

Write throughput is bounded by the single PostgreSQL primary's write
capacity. The cluster scales out for connection capacity and read
fan-out, not for writes against a single PG primary.

The plugin makes one explicit, accepted trade-off: each transaction is
pinned to the `cyoda-go` node that opened it. If that node dies
mid-transaction, PostgreSQL rolls back the connection and the client
receives `TRANSACTION_NODE_UNAVAILABLE` and must retry from scratch.
This trade-off is what lets the plugin run without Paxos, Raft, or
ZooKeeper. For deployments that cannot tolerate this failure mode, the
Cassandra plugin removes it.

## Cassandra (commercial)

The Cassandra plugin is the answer for write volumes that exceed what a
single PostgreSQL primary can absorb, and for high-availability
deployments that cannot tolerate `TRANSACTION_NODE_UNAVAILABLE`.
Transactions are coordinated within the plugin itself rather than
pinned to an owning `cyoda-go` node, so a transaction survives the
mid-flight loss of any one node. The store scales horizontally without
a single-primary bottleneck and supports multi-DC topologies.

The operational footprint is larger than the PostgreSQL plugin: a
Cassandra cluster, a Redpanda message broker, and the `cyoda-go` nodes.
This is the same storage lineage that has run Cyoda Cloud in production
since 2017 — operational provenance, not a sales pitch.

There is one important anti-pattern. The plugin is designed for
entities updated at moderate frequency — tens to low hundreds of
versions over an entity's lifetime. Workloads that update individual
entities thousands of times per day are **not supported**: the version
chain, partition size, and checkpoint cost grow unbounded. If your data
shape is "many entities with moderate update rates," the plugin fits;
if it is "few entities with extreme update rates," it does not.

The Cassandra plugin is available commercially — as the **Enterprise**
edition for self-hosted deployments and as the storage tier underneath
**Cyoda Cloud**. For sizing or licensing, contact Cyoda.

## CPL / Classic

The classic Kotlin/Java runtime has powered Cyoda Cloud in production
with clients since 2017, on a Cassandra storage backend. `cyoda-go` is
an adaptation of the EDBMS design that emerged from CPL — same
contract, same data model, same workflow semantics, different host
language and operational shape.

In day-to-day practice, "CPL" is what you reach for through Cyoda
Cloud. The runtime is operated by Cyoda; you consume it as a service.
For details on the hosted offering — provisioning, identity,
entitlements, and roadmap — see [Cyoda Cloud](/cyoda-cloud/).

## Choosing an engine

Match the engine to the operational shape you can sustain:

- **Local development and tests** — start on **in-memory**. Microsecond
  transactions, no setup, no cleanup.
- **Desktop, edge, single-node production** — **SQLite**. Durable,
  embedded, single binary.
- **Multi-node self-hosted production**, including audit and compliance
  workloads — **PostgreSQL**. Managed PG keeps the operational footprint
  small.
- **Write throughput exceeds single-PG-primary capacity, or HA without
  `TRANSACTION_NODE_UNAVAILABLE`** — **Cassandra** (Enterprise edition).
- **Don't want to run any of it** — **Cyoda Cloud**.

### When to switch

The progression is not a forced upgrade path; some deployments stay on
SQLite indefinitely and that is the right answer for them. Switch when:

- **Write throughput approaches the single-PG-primary ceiling** in
  PostgreSQL deployments, with no managed-PG headroom left or the
  upgrade exceeding the cost of moving — consider Cassandra.
- **Mid-transaction node loss is unacceptable** in your availability
  budget — consider Cassandra; the plugin coordinates transactions at
  the cluster level rather than pinning them to a single node.
- **Operational footprint outweighs the benefit of self-hosting** —
  consider Cyoda Cloud.

The application contract does not change when you move. The
[growth-path framing in Concepts](/concepts/digital-twins-and-growth-path/)
covers the decision in narrative form.

## Where to next

- **Concepts** — [What is Cyoda](/concepts/what-is-cyoda/),
  [Entities and lifecycle](/concepts/entities-and-lifecycle/),
  [Digital twins and the growth path](/concepts/digital-twins-and-growth-path/).
- **Reference** — [Configuration](/reference/configuration/) for per-engine
  environment variables, [CLI](/reference/cli/) for `cyoda-go` commands.
- **Cyoda Cloud** — [hosted service overview](/cyoda-cloud/).
````

- [ ] **Step 2: Build to verify the page renders and all internal links resolve**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds. Astro/Starlight will fail with a broken-link error if any of the cross-links in *Where to next* or in the body do not resolve. Common targets to check (each must exist):

- `/concepts/what-is-cyoda/` — exists (verified)
- `/concepts/entities-and-lifecycle/` — exists (verified)
- `/concepts/digital-twins-and-growth-path/` — exists (verified)
- `/reference/configuration/` — exists (verified)
- `/reference/cli/` — exists (verified)
- `/cyoda-cloud/` — exists after Tasks 2–3 (verified in Task 7)

If any of these is missing, the build will say so. Update the page to drop the offending link rather than leaving it broken.

- [ ] **Step 3: Visual spot-check**

```bash
npm run dev
```

Open http://localhost:4321/run/storage-engines/. Confirm:
- Page renders with the title "Storage engines"
- Sidebar shows the page in the Run group, ordered between *Run* (overview) and *Desktop (single binary)*
- The comparison table is readable on a desktop viewport
- All internal links navigate correctly when clicked

Resize the browser to ~600 px and ~380 px and confirm the table either fits or scrolls horizontally without breaking the layout. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/run/storage-engines.mdx
git commit -m "$(cat <<'EOF'
docs(run): add storage engines overview page

Adds /run/storage-engines/ — a contract-led overview of the five
Cyoda runtime varieties (cyoda-go's four engine plugins plus the
classic CPL/Kotlin runtime that powers Cyoda Cloud). Content is
qualitative; no throughput, latency, or cluster-size numbers are
quoted, and no Cassandra-internal design details are included.

Slotted in the Run sidebar group between Overview and Desktop via
sidebar.order = 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Cross-link from the landing page

The landing page already has a "Four storage engines. One application contract." section (`src/content/docs/index.mdx`, around line 29). Add a one-line pointer to the new page so readers arriving via that section can keep reading.

**Files:**
- Modify: `src/content/docs/index.mdx` (around line 29–34)

- [ ] **Step 1: Locate the section**

```bash
grep -n "Four storage engines" src/content/docs/index.mdx
```

Expected: one match around line 29.

- [ ] **Step 2: Add the pointer**

The current section reads:

```mdx
## Four storage engines. One application contract.

Three open-source engines ship with cyoda-go — in-memory, SQLite, and
PostgreSQL — each tuned to a different operational shape. A commercial
Cassandra plugin extends the same application code to fully scalable,
robust production workloads.

<GrowthPathDiagram />
```

Replace with:

```mdx
## Four storage engines. One application contract.

Three open-source engines ship with cyoda-go — in-memory, SQLite, and
PostgreSQL — each tuned to a different operational shape. A commercial
Cassandra plugin extends the same application code to fully scalable,
robust production workloads.

<GrowthPathDiagram />

→ See [Storage engines](/run/storage-engines/) for per-engine
characteristics and deployment guidance.
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds. The new link `/run/storage-engines/` resolves.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/index.mdx
git commit -m "$(cat <<'EOF'
docs(landing): link Four-storage-engines section to overview page

Adds a pointer from the landing page's storage-engines section to
the new /run/storage-engines/ overview so readers arriving via the
landing have an obvious next step.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Cross-link from `concepts/what-is-cyoda.mdx`

Add a one-line cross-reference from the *What is Cyoda* concept page to the new storage engines overview, near where runtime/deployment is discussed.

**Files:**
- Modify: `src/content/docs/concepts/what-is-cyoda.mdx`

- [ ] **Step 1: Read the page to find the right insertion point**

```bash
grep -in "run\|deploy\|engine\|storage\|runtime" src/content/docs/concepts/what-is-cyoda.mdx
```

Choose the most natural insertion point — typically a section that already discusses where Cyoda runs or how it is deployed. If multiple candidates exist, prefer one near the end so the link is a "next step" rather than an interruption.

- [ ] **Step 2: Add a one-line cross-link**

In the chosen section, append (or insert as the last line of the section):

```markdown
For per-engine operational characteristics and deployment guidance, see [Storage engines](/run/storage-engines/).
```

The exact wording can be adapted to fit the surrounding paragraph style — the load-bearing requirement is that *some* prose link to `/run/storage-engines/` exists in the page.

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/concepts/what-is-cyoda.mdx
git commit -m "$(cat <<'EOF'
docs(concepts): cross-link what-is-cyoda to storage engines

Adds a one-line pointer from the What is Cyoda concept page to the
new /run/storage-engines/ overview, so readers building a mental
model of the platform have a path into the operational story.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Pointer from `run/index.mdx` to the storage engines page

The Run section's index already has a "Pick your packaging" matrix (packaging × engine) and a "License and editions" table — both packaging-led, complementary to the new engine-led page. Add a one-line pointer so the reader can navigate from the packaging view into per-engine detail.

**Files:**
- Modify: `src/content/docs/run/index.mdx` (after the "Pick your packaging" table)

- [ ] **Step 1: Locate the insertion point**

```bash
grep -n "Pick your packaging\|When to pick what" src/content/docs/run/index.mdx
```

Expected: "## Pick your packaging" around line 13, "## When to pick what" around line 22.

- [ ] **Step 2: Add the pointer between the table and the next section**

Find this block in `src/content/docs/run/index.mdx`:

```mdx
|                  | In-Memory | SQLite        | PostgreSQL       | Cassandra |
|------------------|-----------|---------------|------------------|-----------|
| **Desktop**      | ✓         | ✓ *(default)* |                  |           |
| **Docker**       | ✓         | ✓             | ✓                |           |
| **Kubernetes**   |           |               | ✓ *(production)* |           |
| **Cyoda Cloud**  |           |               |                  | ✓         |

## When to pick what
```

Insert one line between the table and the next heading:

```mdx
|                  | In-Memory | SQLite        | PostgreSQL       | Cassandra |
|------------------|-----------|---------------|------------------|-----------|
| **Desktop**      | ✓         | ✓ *(default)* |                  |           |
| **Docker**       | ✓         | ✓             | ✓                |           |
| **Kubernetes**   |           |               | ✓ *(production)* |           |
| **Cyoda Cloud**  |           |               |                  | ✓         |

→ For per-engine durability, fault tolerance, and deployment scope, see [Storage engines](./storage-engines/).

## When to pick what
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds; the relative link `./storage-engines/` resolves to `/run/storage-engines/`.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/run/index.mdx
git commit -m "$(cat <<'EOF'
docs(run): point packaging matrix at storage engines page

Adds a one-line pointer from the Run packaging matrix to the new
/run/storage-engines/ overview, so a reader who arrives at Run
asking 'which packaging' has a path into 'which engine and why'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Final verification

End-to-end checkpoint: full build, full test suite, manual click-through of every new and changed link.

**Files:** none modified.

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds with no broken-link errors. Confirm the build pipeline ran all five steps (schema generation, help-index fetch, Astro build, markdown export, llms.txt generation, schemas zip).

- [ ] **Step 2: Confirm `dist/markdown/run/storage-engines.md` was emitted**

```bash
ls dist/markdown/run/
```

Expected output includes `storage-engines.md` (and the other Run pages: `index.md`, `desktop.md`, `docker.md`, `kubernetes.md`).

- [ ] **Step 3: Confirm `dist/llms.txt` references the new page**

```bash
grep "storage-engines" dist/llms.txt
```

Expected: at least one match.

- [ ] **Step 4: Run tests**

```bash
GA_MEASUREMENT_ID=G-TEST npm test
```

Expected: all tests pass — including the eight `redirects.spec.ts` assertions that now target `/cyoda-cloud/...`.

- [ ] **Step 5: Manual click-through**

```bash
npm run dev
```

Open http://localhost:4321 and click through:

1. Landing page → "Four storage engines. One application contract." section → the new "→ See Storage engines" link → arrives at `/run/storage-engines/`.
2. Concepts → What is Cyoda → the cross-link to Storage engines → arrives at `/run/storage-engines/`.
3. Run → Overview → the packaging-matrix pointer → arrives at `/run/storage-engines/`.
4. Run → Storage engines → each link in the *Where to next* section resolves.
5. Sidebar shows: Getting Started · Concepts · Build · Run · **Cyoda Cloud** · Reference. The Cyoda Cloud group lists its four pages.
6. Visit each legacy URL the redirect tests cover (e.g. `/cloud/entitlements/`, `/architecture/cyoda-cloud-architecture/`) and confirm each lands under `/cyoda-cloud/...`.
7. Resize to ~600 px and ~380 px on the new page; confirm the table is readable (horizontal scroll is acceptable).

Stop the dev server. Do **not** commit anything in this task — it is a verification checkpoint.

---

## Task 13: Push branch and open PR

Final step: push the branch and open a pull request against `main`.

**Files:** none modified.

- [ ] **Step 1: Confirm commit history**

```bash
git log --oneline origin/main..HEAD
```

Expected: 9 commits on top of `origin/main`:

1. `docs(spec): add storage engines overview page design` (already present)
2. `chore(docs): move cyoda-cloud out of run subtree`
3. `chore(sidebar): promote Cyoda Cloud to top-level`
4. `fix(redirects): repoint cyoda-cloud redirects to top-level path`
5. `test(redirects): update cyoda-cloud target assertions`
6. `fix(links): repoint inbound cyoda-cloud references`
7. `docs(run): add storage engines overview page`
8. `docs(landing): link Four-storage-engines section to overview page`
9. `docs(concepts): cross-link what-is-cyoda to storage engines`
10. `docs(run): point packaging matrix at storage engines page`

(That's 10 commits including the spec — counting may vary by one if intermediate fixups were made.)

- [ ] **Step 2: Push the branch**

```bash
git push -u origin docs/storage-engines-page
```

- [ ] **Step 3: Open the PR**

```bash
gh pr create --title "docs: storage engines overview page + Cyoda Cloud sidebar promotion" --body "$(cat <<'EOF'
## Summary

- Adds a contract-led overview page at `/run/storage-engines/` documenting the five Cyoda runtime varieties (cyoda-go's four engine plugins plus the classic CPL/Kotlin runtime). Page is qualitative — no throughput / latency / cluster-size numbers, no Cassandra-internal design content.
- Promotes Cyoda Cloud from a child of Run to a top-level sidebar section (`/cyoda-cloud/`), with all redirects, tests, and inbound links updated.
- Cross-links the new page from the landing page's *Four storage engines. One application contract.* section, from `concepts/what-is-cyoda`, and from `run/index`'s packaging matrix.

Spec: `docs/superpowers/specs/2026-04-28-storage-engines-page-design.md`.

## Test plan

- [ ] `npm run build` passes with no broken-link errors
- [ ] `npm test` passes (Playwright redirect assertions now target `/cyoda-cloud/...`)
- [ ] Sidebar: Getting Started · Concepts · Build · Run · **Cyoda Cloud** · Reference
- [ ] Landing page → "Four storage engines" → Storage engines link works
- [ ] Concepts → What is Cyoda → Storage engines link works
- [ ] Run → Overview → Storage engines link works
- [ ] Storage engines page renders cleanly at desktop, ~600 px, ~380 px
- [ ] Each legacy URL covered by `tests/redirects.spec.ts` lands on `/cyoda-cloud/...`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR is created; print the PR URL for review.

---

## Self-review

**Spec coverage:**
- §1 Goal — Tasks 8 (page), 2–3 (Cyoda Cloud promotion). ✓
- §2 Audience and framing — embedded in Task 8 page content. ✓
- §3.1 New page location — Task 8 frontmatter `sidebar.order: 5` (slots between Overview at 0 and Desktop at 10). ✓
- §3.2 Sidebar reorg — Tasks 2 (move), 3 (sidebar entry), 4 (redirects), 5 (tests), 6 (inbound links). ✓
- §3.3 Cross-references — Tasks 9 (landing), 10 (what-is-cyoda), 11 (run/index pointer). ✓
- §3.4 Out of scope — respected; no content rewrites of `cyoda-cloud/` sub-pages, no benchmarks page. ✓
- §4 Page content outline — Task 8 includes the full MDX. All six sections present, matrix matches approved version, no quantitative numbers, no Cassandra internals. ✓
- §4.3 Confidentiality boundary — Task 8 page reviewed against the boundary; Cassandra section names operational facts only. ✓
- §4.4 Numeric content policy — Task 8 page has no numbers; matrix uses qualitative phrases ("bounded by host RAM", "bounded by single PG primary"). ✓
- §5 Build, test, integration — Tasks 7 and 12 are explicit checkpoints; export-markdown and llms.txt verified in Task 12. ✓
- §6 Risks — Task 7 catches build/link regressions early; Task 5 mirrors redirect-test updates with redirect map. ✓
- §7 Acceptance criteria — every box maps to a step in Tasks 2, 3, 6, 7, 8, 9, 10, 12.

**Placeholder scan:** No TBDs / TODOs / "implement later" / "similar to Task N" patterns found. Each step has either an exact command or exact code/text to apply.

**Type / path / link consistency:** New page is at `/run/storage-engines/`. All cross-links to it use that exact path. All inbound `/run/cyoda-cloud/` references are updated to `/cyoda-cloud/` consistently across `astro.config.mjs`, `tests/redirects.spec.ts`, and the three doc files in Task 6. Frontmatter `sidebar.order: 5` is consistent with existing Run pages (0, 10, 20, 30) — no renumbering needed. Cross-link targets in Task 8 page (`/concepts/what-is-cyoda/`, `/concepts/entities-and-lifecycle/`, `/concepts/digital-twins-and-growth-path/`, `/reference/configuration/`, `/reference/cli/`, `/cyoda-cloud/`) all map to existing pages or pages that will exist after Tasks 2–3.
