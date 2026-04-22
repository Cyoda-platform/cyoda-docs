# Cyoda-docs correctness & alignment review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a deep, citation-grounded correctness and alignment review of every in-scope cyoda-docs page against the cyoda-go OSS codebase, structured so that the post-#80 reframe becomes a mechanical dispatch.

**Architecture:** Three-wave review. Wave 1 dispatches one subagent to extract a ground-truth ledger from cyoda-go at a pinned commit SHA. Wave 2 dispatches five subagents in parallel (one per sidebar section) that verify their section's pages against the ledger and produce per-page review files plus a section summary. Wave 3 runs in the main thread to consolidate findings into a cross-cutting doc and a top-level index.

**Tech Stack:** Bash for scaffolding, Agent tool for subagent dispatch, Markdown for artefacts, git for checkpoints. No code is written; all output is review artefacts under `docs/superpowers/reviews/2026-04-22-correctness/`.

**Spec:** `docs/superpowers/specs/2026-04-22-cyoda-docs-correctness-review-design.md` (committed at `2b76d0e`).

**Working directory:** `/Users/paul/dev/cyoda-docs/.worktrees/pivot`, branch `feature/cyoda-go-init`.

**Reference code:** `~/go-projects/cyoda-light/cyoda-go` (OSS only). `cyoda-go-cassandra` is confidential and must not be read or referenced.

---

## Global preconditions

- Worktree is clean (no unstaged edits) before each commit step.
- `~/go-projects/cyoda-light/cyoda-go` exists and is a git repo; its HEAD is captured and pinned at Task 1.
- All Agent tool calls use `subagent_type: Explore` by default (read-only, no edit/write). Writing of artefact files is done in the main thread after the subagent returns its findings. **Exception:** where a subagent's output is long (ledger, per-page review files, section summaries) we instruct the agent to emit the final file content as the returned message and the main thread writes it to disk — this keeps main-context pollution bounded.

## File structure (artefacts produced)

```
docs/superpowers/reviews/2026-04-22-correctness/
  README.md              ─ index; written initially in Task 2, finalized in Task 14
  CYODA_GO_SHA           ─ single line: the pinned cyoda-go commit SHA (written Task 1)
  ledger.md              ─ Wave 1 output (written Task 4)
  pages/                 ─ one file per in-scope doc page (written Tasks 6-10)
    getting-started__install-and-first-entity.md
    concepts__what-is-cyoda.md
    concepts__entities-and-lifecycle.md
    concepts__workflows-and-events.md
    concepts__digital-twins-and-growth-path.md
    concepts__apis-and-surfaces.md
    concepts__authentication-and-identity.md
    concepts__design-principles.md
    build__index.md
    build__modeling-entities.md
    build__workflows-and-processors.md
    build__working-with-entities.md
    build__searching-entities.md
    build__analytics-with-sql.md
    build__client-compute-nodes.md
    build__testing-with-digital-twins.md
    run__index.md
    run__desktop.md
    run__docker.md
    run__kubernetes.md
    reference__index.md
    reference__api.md
    reference__cli.md
    reference__configuration.md
    reference__helm.md
    reference__trino.md
    reference__entity-model-export.md
    reference__schemas.md
    root__index.md            ─ review of src/content/docs/index.mdx
  sections/              ─ one summary per section (written Tasks 6-10)
    getting-started.md
    concepts.md
    build.md
    run.md
    reference.md
  cross-cutting.md       ─ Wave 3 output (written Task 12)
```

**In-scope page count:** 28 (1 root landing + 1 getting-started + 7 concepts + 8 build + 4 run + 8 reference — `src/content/docs/reference/schemas.mdx` is the hand-written schemas landing page, not the auto-generated tree).

---

## Task 1: Pin cyoda-go commit and scaffold review directory

**Files:**
- Create: `docs/superpowers/reviews/2026-04-22-correctness/CYODA_GO_SHA`
- Create: `docs/superpowers/reviews/2026-04-22-correctness/pages/.gitkeep`
- Create: `docs/superpowers/reviews/2026-04-22-correctness/sections/.gitkeep`

- [ ] **Step 1: Capture the cyoda-go SHA**

Run:
```bash
cd ~/go-projects/cyoda-light/cyoda-go && git rev-parse HEAD
```

Expected: a 40-char SHA. Record it for the next step. (As of plan authoring, HEAD is `6442de4696854ee8aa3b6d2ea9345b9c96eb6aad`; re-check and use current HEAD.)

- [ ] **Step 2: Create review scaffolding**

From `/Users/paul/dev/cyoda-docs/.worktrees/pivot`, run:
```bash
mkdir -p docs/superpowers/reviews/2026-04-22-correctness/pages
mkdir -p docs/superpowers/reviews/2026-04-22-correctness/sections
echo "<SHA_FROM_STEP_1>" > docs/superpowers/reviews/2026-04-22-correctness/CYODA_GO_SHA
touch docs/superpowers/reviews/2026-04-22-correctness/pages/.gitkeep
touch docs/superpowers/reviews/2026-04-22-correctness/sections/.gitkeep
```

- [ ] **Step 3: Verify scaffolding**

Run:
```bash
ls -la docs/superpowers/reviews/2026-04-22-correctness/
cat docs/superpowers/reviews/2026-04-22-correctness/CYODA_GO_SHA
```

Expected: four entries (`CYODA_GO_SHA`, `pages/`, `sections/`, nothing else) and the SHA prints.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/
git commit -m "$(cat <<'EOF'
docs(reviews): scaffold 2026-04-22 correctness review directory

Pin cyoda-go commit SHA for ledger and all per-page reviews. All
findings will be cited against this frozen reference so the review
is reproducible.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Write initial README index

**Files:**
- Create: `docs/superpowers/reviews/2026-04-22-correctness/README.md`

- [ ] **Step 1: Write the index skeleton**

Write the following to `docs/superpowers/reviews/2026-04-22-correctness/README.md`:

```markdown
# Cyoda-docs correctness & alignment review — 2026-04-22

**Spec:** [../../specs/2026-04-22-cyoda-docs-correctness-review-design.md](../../specs/2026-04-22-cyoda-docs-correctness-review-design.md)
**Plan:** [../../plans/2026-04-22-cyoda-docs-correctness-review.md](../../plans/2026-04-22-cyoda-docs-correctness-review.md)
**cyoda-go ref:** see `CYODA_GO_SHA`
**Scope:** OSS cyoda-go only. `cyoda-go-cassandra` is confidential, out of scope. `run/cyoda-cloud/**` is out of scope.

## Status

| Wave | Artefact | Status |
|------|----------|--------|
| 1 | `ledger.md` | pending |
| 2 | `pages/*.md` + `sections/*.md` | pending |
| 3 | `cross-cutting.md` + this index (finalized) | pending |

## Per-page index

_Populated in Task 13 after all per-page reviews land._

## Cross-cutting findings

_See [cross-cutting.md](cross-cutting.md) once Wave 3 completes._
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/README.md
git commit -m "$(cat <<'EOF'
docs(reviews): add 2026-04-22 correctness review README skeleton

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Dispatch Wave 1 — ground-truth ledger subagent

**Files:**
- Will create via main-thread write after subagent returns: `docs/superpowers/reviews/2026-04-22-correctness/ledger.md`

- [ ] **Step 1: Dispatch the ledger subagent**

Use the Agent tool with `subagent_type: Explore`, `description: "Ledger: extract cyoda-go ground truth"`, and this exact prompt (substitute `<PINNED_SHA>` with the SHA from Task 1):

```
You are producing the ground-truth ledger for a cyoda-docs correctness review.
The ledger is the canonical record of what cyoda-go actually does today, at a
pinned commit. It becomes the reference every downstream reviewer and the
post-#80 alignment test uses.

Reference code: ~/go-projects/cyoda-light/cyoda-go at commit <PINNED_SHA>.
Check out that commit or verify HEAD matches before reading.

Scope: OSS cyoda-go only. Do NOT read ~/go-projects/cyoda-light/cyoda-go-cassandra
(confidential) or make any claim that depends on its behavior. If a surface has
a Cassandra-tier delta, record "OSS behavior; Cassandra-tier delta out of scope."

Depth requirements — non-negotiable:

1. Read the implementation, not just signatures. For every surface, trace
   behavior end-to-end: handler → service → plugin/storage → response. Don't
   stop at api/openapi.yaml; follow the handler to confirm it matches. Don't
   stop at a flag declaration; follow it to where it changes behavior.
2. No "looks like" grounding. Every ledger entry cites a file:line you have
   actually read. "Probably X based on type name" is NOT admissible.
3. Capture non-obvious specificities: precedence subtleties, retry/idempotency
   contracts, side effects on workflow state, atomicity of transitions,
   error-path behaviors, default flip conditions (mock ↔ JWT),
   timeout/cancellation semantics, revision-immutability contracts.
4. Read the tests. internal/e2e/, test/recon/, and handler-level tests pin
   contracts. Tests are often the fastest path to intended behavior.
5. "Not implemented" is a valid entry. If a surface the docs might claim
   doesn't exist in cyoda-go, record that.
6. Take the time to understand. A correct ledger is worth much more than a
   fast one.

Surfaces to cover (each gets its own H2 section, citation-first, terse prose,
no essays):

- CLI — every `cyoda` subcommand, SYNOPSIS, flags (name, type, default),
  env-var companions. Cite cmd/cyoda/*.go.
- Configuration — env var names, types, defaults, precedence rules (flag >
  env > file > default), _FILE secret pattern.
- REST surface — endpoint paths, verbs, request/response shapes, auth,
  pagination, temporal parameter spelling. Cite api/openapi.yaml AND
  handler files (handler must confirm the OAS).
- gRPC surface — services, RPCs, CloudEvents envelope shape, compute-node
  protocol. Cite proto/cyoda/** and the compute-node implementation.
- Workflow JSON shape — canonical map-keyed structure (states, initialState,
  transitions with `next`, processors, criteria). Cite internal/** and
  examples/**; tests pin the contract.
- Entity model — modelVersion semantics, discover vs lock modes, revision
  immutability, SIMPLE_VIEW export shape.
- Search — query modes (direct/async), predicate grammar, pagination,
  `pointInTime` (REST) vs `point_time` (Trino).
- Analytics / Trino — catalog layout, JDBC URL template, AS OF equivalent.
- Error model — RFC 7807 Problem Details shape, gRPC status mapping,
  canonical error codes where enumerated.
- Deployment — Docker patterns, Helm chart values (deploy/helm/), desktop shape.
- Auth — CYODA_IAM_MODE values, defaults, JWT flip, local-dev no-auth default.
- Telemetry — metrics (name, type, labels), health/readiness endpoints,
  tracing headers, log schema, as they exist today.

Output format: emit the full ledger.md contents as a single markdown document.
Structure:

    # cyoda-go ground-truth ledger

    **cyoda-go ref:** <PINNED_SHA>
    **Scope:** OSS cyoda-go only.

    ## CLI
    ...
    ## Configuration
    ...
    ...

Each surface uses bullet points or small tables, every non-trivial claim cites
`path:line` or `path:L<start>-L<end>`. Target ~800-1500 lines total. Terse.

Return the complete ledger.md content as your response. Do not write files.
```

- [ ] **Step 2: Write the ledger to disk**

Take the agent's returned markdown and write it verbatim to:
`docs/superpowers/reviews/2026-04-22-correctness/ledger.md`

- [ ] **Step 3: Verify acceptance criteria**

Check:
- Ledger has sections for all 12 surfaces listed above.
- `grep -c ':L\?[0-9]' ledger.md` returns a large number (hundreds of citations expected).
- Ledger length is between 400 and 2500 lines (looser bound than the target; flag for revision if far outside).
- No references to `cyoda-go-cassandra` anywhere.

Run:
```bash
wc -l docs/superpowers/reviews/2026-04-22-correctness/ledger.md
grep -c ':L' docs/superpowers/reviews/2026-04-22-correctness/ledger.md || true
grep -c ':[0-9]' docs/superpowers/reviews/2026-04-22-correctness/ledger.md || true
grep -c 'cassandra' docs/superpowers/reviews/2026-04-22-correctness/ledger.md || true
```

Expected: line count within bounds; citation count high; Cassandra count = 0 (or only in explicit out-of-scope notes).

If the ledger falls short (missing surfaces, few citations, or shallow entries), re-dispatch the subagent with a targeted correction prompt for the specific gap. Do not accept a shallow ledger.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/ledger.md
git commit -m "$(cat <<'EOF'
docs(reviews): add Wave 1 cyoda-go ground-truth ledger

Citation-first record of CLI, configuration, REST, gRPC, workflow
JSON shape, entity model, search, Trino, error model, deployment,
auth, and telemetry surfaces. Pinned to the cyoda-go commit in
CYODA_GO_SHA. Input to all Wave 2 per-section reviewers and to the
post-#80 alignment test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Dispatch Wave 2 — concepts/ section subagent

**Files:**
- Will create via main-thread write after subagent returns:
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__what-is-cyoda.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__entities-and-lifecycle.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__workflows-and-events.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__digital-twins-and-growth-path.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__apis-and-surfaces.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__authentication-and-identity.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__design-principles.md`
  - `docs/superpowers/reviews/2026-04-22-correctness/sections/concepts.md`

**Parallelism:** Tasks 4, 5, 6, 7, 8 are all Wave 2 section subagents and can be dispatched concurrently in one message if the execution harness supports it.

- [ ] **Step 1: Dispatch the concepts section subagent**

Use the Agent tool with `subagent_type: Explore`, `description: "Wave 2: concepts section review"`, and the prompt template at the bottom of this plan (see **Wave 2 subagent prompt template**) filled in with:

- `<SECTION>`: `concepts`
- `<PINNED_SHA>`: SHA from Task 1
- `<PAGES>`:
  - `src/content/docs/concepts/what-is-cyoda.mdx` → output file `pages/concepts__what-is-cyoda.md`
  - `src/content/docs/concepts/entities-and-lifecycle.md` → `pages/concepts__entities-and-lifecycle.md`
  - `src/content/docs/concepts/workflows-and-events.md` → `pages/concepts__workflows-and-events.md`
  - `src/content/docs/concepts/digital-twins-and-growth-path.mdx` → `pages/concepts__digital-twins-and-growth-path.md`
  - `src/content/docs/concepts/apis-and-surfaces.md` → `pages/concepts__apis-and-surfaces.md`
  - `src/content/docs/concepts/authentication-and-identity.md` → `pages/concepts__authentication-and-identity.md`
  - `src/content/docs/concepts/design-principles.mdx` → `pages/concepts__design-principles.md`
- `<TOPIC_LENS>`:

  ```
  Before reading any page, build a deep understanding of: entity model
  (modelVersion, discover/lock modes, revision immutability), workflow
  runtime semantics (state machine, transitions, processors, criteria,
  atomicity, audit trail), the REST/gRPC/Trino surface split and WHEN
  each is used, digital-twin/growth-path tier story, authentication
  model (CYODA_IAM_MODE mock/JWT, on-behalf-of, external-key trust).
  Read the ledger's relevant surfaces first. Then read internal/** for
  workflow and entity-model runtime. Only after you can defend the
  mental model should you open the seven pages.
  ```

- [ ] **Step 2: Write returned files to disk**

Agent returns 8 markdown documents (7 per-page + 1 section summary) clearly delimited (see prompt template for format). Parse, and for each delimited file, write to the exact path specified.

- [ ] **Step 3: Verify each file conforms to the schema**

For each of the 7 per-page files, verify:
- Has frontmatter with `page:`, `section: concepts`, `reviewed_by:`, `reviewed_on:`, `cyoda_go_ref:`, `status: reviewed`.
- Has `## Summary`, `## Correctness findings`, `## Clarity suggestions`, `## Coverage notes` in that order.
- Every correctness finding is bucketed `Fix now`, `Reframe post-#80`, or `Delete post-#80`.
- Every correctness finding has `**Citation:**` with a `file:line` reference.
- Clarity suggestions count ≤ 5 or collapsed into a single Structural recommendation.

Run:
```bash
for f in docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__*.md; do
  echo "=== $f ==="
  grep -E '^(page:|section:|reviewed_by:|reviewed_on:|cyoda_go_ref:|status:|## )' "$f"
  echo "buckets: $(grep -cE '(Fix now|Reframe post-#80|Delete post-#80)' "$f")"
  echo "citations: $(grep -c '\*\*Citation:\*\*' "$f")"
done
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__*.md \
        docs/superpowers/reviews/2026-04-22-correctness/sections/concepts.md
git commit -m "$(cat <<'EOF'
docs(reviews): Wave 2 concepts/ section review

Seven per-page correctness reviews + section summary. All findings
grounded in the cyoda-go ledger at the pinned commit. Remediations
bucketed Fix now / Reframe post-#80 / Delete post-#80.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Dispatch Wave 2 — build/ section subagent

**Files:**
- Will create via main-thread write:
  - `docs/superpowers/reviews/2026-04-22-correctness/pages/build__index.md`
  - `pages/build__modeling-entities.md`
  - `pages/build__workflows-and-processors.md`
  - `pages/build__working-with-entities.md`
  - `pages/build__searching-entities.md`
  - `pages/build__analytics-with-sql.md`
  - `pages/build__client-compute-nodes.md`
  - `pages/build__testing-with-digital-twins.md`
  - `sections/build.md`

- [ ] **Step 1: Dispatch**

Agent tool with `subagent_type: Explore`, `description: "Wave 2: build section review"`, prompt filled from the template with:

- `<SECTION>`: `build`
- `<PINNED_SHA>`: SHA from Task 1
- `<PAGES>`:
  - `src/content/docs/build/index.mdx` → `pages/build__index.md`
  - `src/content/docs/build/modeling-entities.md` → `pages/build__modeling-entities.md`
  - `src/content/docs/build/workflows-and-processors.mdx` → `pages/build__workflows-and-processors.md`
  - `src/content/docs/build/working-with-entities.md` → `pages/build__working-with-entities.md`
  - `src/content/docs/build/searching-entities.md` → `pages/build__searching-entities.md`
  - `src/content/docs/build/analytics-with-sql.md` → `pages/build__analytics-with-sql.md`
  - `src/content/docs/build/client-compute-nodes.md` → `pages/build__client-compute-nodes.md`
  - `src/content/docs/build/testing-with-digital-twins.md` → `pages/build__testing-with-digital-twins.md`
- `<TOPIC_LENS>`:

  ```
  Before reading any page, build deep understanding of: workflow runtime
  (state-machine execution, transition atomicity, processor event contract,
  at-least-once/idempotency, dedup key, criteria gating), entity CRUD and
  transition semantics, search execution (direct vs async, predicate
  grammar, pagination, pointInTime), analytics/Trino SQL surface, compute
  node handshake/lease model, digital-twin testing model. Read the ledger
  sections for workflow, entity model, search, Trino, gRPC. Read
  internal/e2e/ and test/recon/ where relevant. Open the pages only after.
  ```

- [ ] **Step 2–4: Write files, verify schema, commit**

Same structure as Task 4, Steps 2–4. Commit message:

```
docs(reviews): Wave 2 build/ section review
```

---

## Task 6: Dispatch Wave 2 — run/ section subagent

**Files:**
- Will create: `pages/run__index.md`, `pages/run__desktop.md`, `pages/run__docker.md`, `pages/run__kubernetes.md`, `sections/run.md`.

- [ ] **Step 1: Dispatch**

Agent with `subagent_type: Explore`, `description: "Wave 2: run section review"`, prompt filled from template:

- `<SECTION>`: `run`
- `<PINNED_SHA>`: SHA from Task 1
- `<PAGES>`:
  - `src/content/docs/run/index.mdx` → `pages/run__index.md`
  - `src/content/docs/run/desktop.md` → `pages/run__desktop.md`
  - `src/content/docs/run/docker.md` → `pages/run__docker.md`
  - `src/content/docs/run/kubernetes.md` → `pages/run__kubernetes.md`
- `<TOPIC_LENS>`:

  ```
  Before reading any page, build deep understanding of: deployment shapes
  cyoda-go actually supports (desktop, docker, kubernetes), configuration
  model, required/optional env vars for a minimum viable deployment, auth
  modes (CYODA_IAM_MODE mock default vs JWT), license/editions story
  (OSS Apache 2.0 vs Cloud Beta vs Enterprise Cassandra), statelessness
  of the cyoda-go cluster and why HA is a backing-store concern. Read the
  ledger sections for CLI, Configuration, Deployment, Auth. Read
  deploy/docker/, deploy/helm/. Do NOT venture into Cloud-specific pages.
  ```

Also include this explicit gate in the prompt: "Do NOT file Reframe/Delete findings against operational content that belongs to the operator or the backing-store vendor (Postgres HA, Cassandra HA, DR, multi-region, sizing model). That is out of scope for Cyoda to document."

- [ ] **Step 2–4: Write files, verify schema, commit**

Commit message:

```
docs(reviews): Wave 2 run/ section review (OSS only)
```

---

## Task 7: Dispatch Wave 2 — reference/ section subagent

**Files:**
- Will create: `pages/reference__index.md`, `pages/reference__api.md`, `pages/reference__cli.md`, `pages/reference__configuration.md`, `pages/reference__helm.md`, `pages/reference__trino.md`, `pages/reference__entity-model-export.md`, `pages/reference__schemas.md`, `sections/reference.md`.

- [ ] **Step 1: Dispatch**

Agent with `subagent_type: Explore`, `description: "Wave 2: reference section review"`, prompt filled from template:

- `<SECTION>`: `reference`
- `<PINNED_SHA>`: SHA from Task 1
- `<PAGES>`:
  - `src/content/docs/reference/index.mdx` → `pages/reference__index.md`
  - `src/content/docs/reference/api.mdx` → `pages/reference__api.md`
  - `src/content/docs/reference/cli.mdx` → `pages/reference__cli.md`
  - `src/content/docs/reference/configuration.mdx` → `pages/reference__configuration.md`
  - `src/content/docs/reference/helm.mdx` → `pages/reference__helm.md`
  - `src/content/docs/reference/trino.mdx` → `pages/reference__trino.md`
  - `src/content/docs/reference/entity-model-export.mdx` → `pages/reference__entity-model-export.md`
  - `src/content/docs/reference/schemas.mdx` → `pages/reference__schemas.md`
- `<TOPIC_LENS>`:

  ```
  Before reading any page, build deep understanding of: the full CLI
  (cmd/cyoda/), the full configuration model, the Helm chart in
  deploy/helm/, the OpenAPI spec in api/openapi.yaml and its handlers,
  Trino catalog/projection rules, the entity model export contract
  (SIMPLE_VIEW), the JSON Schema set under src/schemas/. Read the ledger
  sections for CLI, Configuration, REST, gRPC, Analytics, Deployment.
  Open the pages only after. Reference pages currently carry
  `awaiting-upstream` banners; those banners are intentional and are
  NOT themselves a finding — they are the pre-#80 holding pattern.
  Findings on these pages are claims the doc makes IN ADDITION TO the
  banner (e.g., prose that drifts from cyoda-go, structural issues, or
  specific flag/env/endpoint claims that will be authoritatively owned
  by help topics post-#80).
  ```

Additional gate in the prompt: "Reference pages are the most likely place for Reframe post-#80 / Delete post-#80 findings because they carry the structural content help will own. Bucket accordingly. But the `awaiting-upstream` banner existing is not itself a finding."

- [ ] **Step 2–4: Write files, verify schema, commit**

Commit message:

```
docs(reviews): Wave 2 reference/ section review
```

---

## Task 8: Dispatch Wave 2 — getting-started/ + root index subagent

**Files:**
- Will create: `pages/getting-started__install-and-first-entity.md`, `pages/root__index.md`, `sections/getting-started.md`.

Rationale: `getting-started/` has only one page, so pair it with the site landing `src/content/docs/index.mdx` (which needs a light factual check per the spec). The section summary covers both.

- [ ] **Step 1: Dispatch**

Agent with `subagent_type: Explore`, `description: "Wave 2: getting-started + root review"`, prompt filled from template:

- `<SECTION>`: `getting-started`
- `<PINNED_SHA>`: SHA from Task 1
- `<PAGES>`:
  - `src/content/docs/getting-started/install-and-first-entity.mdx` → `pages/getting-started__install-and-first-entity.md`
  - `src/content/docs/index.mdx` → `pages/root__index.md`
- `<TOPIC_LENS>`:

  ```
  Before reading either page, build deep understanding of: the onramp
  path an OSS self-hoster actually walks (binary download, init,
  SQLite default, create first entity, trigger first workflow),
  auth default in local dev (CYODA_IAM_MODE=mock), workflow JSON
  canonical shape (this page has been a repeat offender for drift
  against canonical shape — verify with care), initial request/response
  shapes for first-entity flow. Read the ledger sections for CLI,
  Configuration, Auth, Workflow JSON shape, Entity model. Read
  internal/e2e/entity_lifecycle_test.go as the pinned contract. Open
  the pages only after.
  ```

Additional note for root `index.mdx`: "Review src/content/docs/index.mdx only for factual claims that can be wrong against cyoda-go (positioning, editions table, license claims, first-onramp pointer). Do NOT file clarity suggestions on marketing prose."

- [ ] **Step 2–4: Write files, verify schema, commit**

Commit message:

```
docs(reviews): Wave 2 getting-started + root landing review
```

---

## Task 9: Verify Wave 2 completeness

- [ ] **Step 1: Count per-page files**

Run:
```bash
ls docs/superpowers/reviews/2026-04-22-correctness/pages/ | wc -l
ls docs/superpowers/reviews/2026-04-22-correctness/sections/ | wc -l
```

Expected:
- pages: **28** (7 concepts + 8 build + 4 run + 8 reference + 1 getting-started + 1 root, minus `.gitkeep` if still present — `ls` will show it; use `ls | grep -v gitkeep` for a clean count).
- sections: **5** (concepts, build, run, reference, getting-started).

- [ ] **Step 2: Schema sweep across all per-page files**

Run:
```bash
for f in docs/superpowers/reviews/2026-04-22-correctness/pages/*.md; do
  [ "$(basename "$f")" = ".gitkeep" ] && continue
  [ "$(grep -c '^status: reviewed' "$f")" -eq 1 ] || echo "MISSING status: $f"
  [ "$(grep -c '^## Correctness findings' "$f")" -eq 1 ] || echo "MISSING findings: $f"
  [ "$(grep -c '^## Clarity suggestions' "$f")" -eq 1 ] || echo "MISSING clarity: $f"
  [ "$(grep -c '^## Coverage notes' "$f")" -eq 1 ] || echo "MISSING coverage: $f"
done
```

Expected: no `MISSING` output. Any `MISSING` line means that page's review needs re-dispatch via the Wave 2 agent for its section.

- [ ] **Step 3: Global guardrail sweep**

Run:
```bash
grep -l 'cyoda-go-cassandra' docs/superpowers/reviews/2026-04-22-correctness/ -r || echo "clean: no cyoda-go-cassandra refs"
grep -l 'cyoda-cloud\|Cyoda Cloud' docs/superpowers/reviews/2026-04-22-correctness/pages/ -r
```

Expected: clean for cassandra. Cloud mentions may appear in passing (e.g., "Cloud is a delta out of scope") — skim the hits to confirm none make Cloud-specific correctness claims.

- [ ] **Step 4: No commit this task** (verification only; any remediation re-dispatches the relevant Wave 2 task).

---

## Task 10: Wave 3 consolidation — cross-cutting findings

**Files:**
- Create: `docs/superpowers/reviews/2026-04-22-correctness/cross-cutting.md`

This task runs in the main thread, serial. No subagent.

- [ ] **Step 1: Read all section summaries**

Read all five files in `docs/superpowers/reviews/2026-04-22-correctness/sections/`.

- [ ] **Step 2: Skim all per-page files for cross-cutting patterns**

Read through `docs/superpowers/reviews/2026-04-22-correctness/pages/*.md`, noting only patterns that span multiple pages. Do NOT extract per-page findings — those already live in the per-page files.

- [ ] **Step 3: Write cross-cutting.md**

Write the following structure to `docs/superpowers/reviews/2026-04-22-correctness/cross-cutting.md`:

```markdown
# Cross-cutting findings — 2026-04-22 correctness review

**Inputs:** sections/*.md summaries + skim of pages/*.md.
**Scope:** issues that span multiple pages, not per-page findings.

## 1. Terminology drift

For each inconsistent term across the site:

### <term>
- **Pages affected:** <list>
- **Variants seen:** <list>
- **Canonical form:** <pick one, with rationale>
- **Remediation bucket:** Fix now | Reframe post-#80

(If no drift, "None observed.")

## 2. Duplicated reference content

Each block of reference content described on more than one page — a candidate for post-#80 collapse into a help topic.

### <content>
- **Appears in:** <list of pages>
- **Proposed help topic:** `cyoda help <topic>` (per #80 topic tree)
- **Remediation bucket:** Reframe post-#80 (consolidate into callout pointing at one help topic) or Delete post-#80 (pure duplication goes away entirely).

## 3. Contradictions

Where two pages make incompatible claims.

### <claim>
- **Page A says:** <quote + path>
- **Page B says:** <quote + path>
- **Ground truth (ledger):** <cited fact>
- **Remediation:** <which page to change, bucket>

## 4. Coverage gaps

Site-wide: surfaces cyoda-go exposes that no page covers, and doc claims no page could ground.

### <topic>
- **Ledger says:** <cited fact or "surface not present">
- **Docs say:** <either nothing, or "X" with no grounding>
- **Bucket:** Fix now | Reframe post-#80 | Delete post-#80

## 5. Clarity-suggestion synthesis

Clarity suggestions that ≥2 section agents independently proposed. A site-wide convention gap, not per-page nits.

### <suggestion>
- **Proposed by:** <list of sections>
- **Scope:** <which pages benefit>
- **Recommendation:** <one paragraph>
```

Populate each section from the section summaries and per-page skim. Omit sections with no material content ("None observed." under the heading is fine).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/cross-cutting.md
git commit -m "$(cat <<'EOF'
docs(reviews): Wave 3 cross-cutting findings

Synthesis across all five section reviews: terminology drift,
duplicated reference content, contradictions, coverage gaps,
clarity-suggestion convergence.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Finalize README index

**Files:**
- Modify: `docs/superpowers/reviews/2026-04-22-correctness/README.md`

- [ ] **Step 1: Compute per-page bucket counts**

Run:
```bash
cd docs/superpowers/reviews/2026-04-22-correctness/pages
for f in *.md; do
  [ "$f" = ".gitkeep" ] && continue
  fix_now=$(grep -c '— \*\*Fix now\*\*' "$f" || true)
  reframe=$(grep -c '\*\*Reframe post-#80\*\*' "$f" || true)
  delete=$(grep -c '\*\*Delete post-#80\*\*' "$f" || true)
  clarity=$(awk '/^## Clarity suggestions/,/^## Coverage notes/' "$f" | grep -c '^### C')
  echo "$f|$fix_now|$reframe|$delete|$clarity"
done
```

Expected: one line per page, pipe-delimited counts. Capture this output for the table.

- [ ] **Step 2: Rewrite README.md**

Replace the previous README with the finalized index:

```markdown
# Cyoda-docs correctness & alignment review — 2026-04-22

**Spec:** [../../specs/2026-04-22-cyoda-docs-correctness-review-design.md](../../specs/2026-04-22-cyoda-docs-correctness-review-design.md)
**Plan:** [../../plans/2026-04-22-cyoda-docs-correctness-review.md](../../plans/2026-04-22-cyoda-docs-correctness-review.md)
**cyoda-go ref:** see [`CYODA_GO_SHA`](CYODA_GO_SHA)
**Scope:** OSS cyoda-go only. Cloud pages and confidential tier out of scope.

## Status

| Wave | Artefact | Status |
|------|----------|--------|
| 1 | [`ledger.md`](ledger.md) | complete |
| 2 | `pages/*.md` + `sections/*.md` | complete |
| 3 | [`cross-cutting.md`](cross-cutting.md) + this index | complete |

## Per-page index

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| [getting-started/install-and-first-entity](pages/getting-started__install-and-first-entity.md) | ? | ? | ? | ? |
| [root index.mdx](pages/root__index.md) | ? | ? | ? | ? |
| [concepts/what-is-cyoda](pages/concepts__what-is-cyoda.md) | ? | ? | ? | ? |
| … one row per in-scope page … |

## Section summaries

- [getting-started](sections/getting-started.md)
- [concepts](sections/concepts.md)
- [build](sections/build.md)
- [run](sections/run.md)
- [reference](sections/reference.md)

## Cross-cutting findings

See [`cross-cutting.md`](cross-cutting.md).

## Next steps

1. **Fix-now remediation PR** — cut a branch off `feature/cyoda-go-init`, action every **Fix now** finding and every accepted clarity suggestion, review, merge.
2. **Wait for cyoda-go #80** — when it ships, run the alignment test (Spec §"Post-#80 alignment test").
3. **Post-#80 reframe PR** — dispatch the enumerated Reframe post-#80 / Delete post-#80 worklist. Add "From the binary" callouts per cyoda-docs #69. Drop `awaiting-upstream` banners.
```

Fill every `?` with the numbers computed in Step 1.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/README.md
git commit -m "$(cat <<'EOF'
docs(reviews): finalize 2026-04-22 correctness review index

Per-page bucket counts, section summary links, cross-cutting pointer,
next-steps pointing at the Fix-now remediation PR and the post-#80
reframe dispatch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Close out — update handoff

**Files:**
- Modify: `docs/superpowers/reviews/2026-04-21-session-handoff.md`

- [ ] **Step 1: Append a new section to the handoff**

Add below "Open threads (pick up in this order)":

```markdown
### 6. 2026-04-22 correctness & alignment review — COMPLETE

Deep citation-grounded review of every in-scope cyoda-docs page against
cyoda-go at a pinned commit, framed around the assumption that #80
ships as proposed.

Artefacts: `docs/superpowers/reviews/2026-04-22-correctness/` —
`README.md` (index), `ledger.md` (ground truth), `pages/*.md` (per-page
findings), `sections/*.md`, `cross-cutting.md`. Spec:
`docs/superpowers/specs/2026-04-22-cyoda-docs-correctness-review-design.md`.
Plan: `docs/superpowers/plans/2026-04-22-cyoda-docs-correctness-review.md`.

Next:
- Action every **Fix now** finding + accepted clarity suggestions on a
  new branch off `feature/cyoda-go-init`.
- When cyoda-go #80 ships: run the post-#80 alignment test (ledger ↔
  help.json diff; per-page Reframe/Delete dispatch per #69).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/reviews/2026-04-21-session-handoff.md
git commit -m "$(cat <<'EOF'
docs: handoff — correctness review complete, point at next steps

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 2 subagent prompt template

Used by Tasks 4, 5, 6, 7, 8 (verbatim, with the named substitutions). Do not shorten.

```
You are conducting a correctness and alignment review of cyoda-docs
pages for the `<SECTION>` section, against cyoda-go OSS at commit
<PINNED_SHA>. This is a FRESH sweep — do not read or consider any
prior review (the 2026-04-21 three-persona review is out of context
deliberately).

Inputs:
- Working directory: /Users/paul/dev/cyoda-docs/.worktrees/pivot
- Ledger: docs/superpowers/reviews/2026-04-22-correctness/ledger.md
  (read this first; it is citation-first ground truth)
- cyoda-go source: ~/go-projects/cyoda-light/cyoda-go at <PINNED_SHA>
  (verify HEAD or check out the pinned commit before reading)
- Pages to review (cyoda-docs path → output artefact path):
  <PAGES>

Scope guardrails:
- OSS cyoda-go only. Never read ~/go-projects/cyoda-light/cyoda-go-cassandra
  (confidential). Do not include any claim that depends on its behavior.
- `run/cyoda-cloud/**` is out of scope. If a page cross-references a
  Cloud page, that's a link, not a claim to verify.
- You do NOT edit any cyoda-docs file. Review output only.

Depth of understanding — non-negotiable:

<TOPIC_LENS>

In addition:
1. Read the implementation, not just signatures. Trace behavior
   end-to-end for every claim category in your section's pages.
2. No "looks like" grounding. Every correctness finding cites
   file:line you have actually read.
3. No pattern-matching from other systems. Cyoda is an EDBMS — not
   Kafka, not Confluent Schema Registry, not CRUD-over-REST, not
   Postgres-with-extras. If a page's framing resembles one of those,
   verify the resemblance before trusting it.
4. When in doubt, read the test. internal/e2e/, test/recon/, and
   handler-level tests are often the cleanest contract source.
5. Take the time to understand. A correct review is worth more than
   a fast one. Targeted enumeration applies to what you write down,
   not to how thoroughly you understand the topic.

Per-page process:
1. Read the page once end-to-end without cross-referencing.
2. Enumerate concrete claims: flag names, env vars, endpoint paths,
   field names, JSON/YAML shapes, CLI invocations, type signatures,
   behavior statements.
3. For each concrete claim, verify against the ledger; where the
   ledger is silent, read cyoda-go directly and cite file:line.
4. Sanity-read the narrative prose (targeted, not line-by-line).
5. Produce the per-page review file per the schema below.

Per-page file schema (emit this exact structure for each page):

    ---
    page: <cyoda-docs path>
    section: <SECTION>
    reviewed_by: <your agent id or "wave2-<SECTION>">
    reviewed_on: 2026-04-22
    cyoda_go_ref: <PINNED_SHA>
    status: reviewed
    ---

    # <page title> — correctness review

    ## Summary
    One paragraph: correctness posture (clean / minor / major / structural
    rewrite), one-line clarity characterization, one-line coverage verdict.

    ## Correctness findings

    ### F1 — <short claim> — **Fix now** | **Reframe post-#80** | **Delete post-#80**
    **Doc says:** <quote or near-verbatim, with heading or line ref>
    **Ground truth:** <what cyoda-go does>
    **Citation:** `<cyoda-go path>:<line>` or `<path>:L<start>-L<end>`
    **Remediation:** <1-3 sentences; for Reframe/Delete, what moves to help>

    (repeat per finding; if none, write "None." under the heading)

    ## Clarity suggestions

    ### C1 — <short label>
    <1-3 sentences: what to improve and why it helps a first-time reader>

    (cap at ~5; if more, collapse into a single **Structural recommendation**
    block instead. If none qualify, write "None." under the heading.)

    ## Coverage notes

    - **Expected but missing:** <surface expected from cyoda-go, not in the page>
    - **Present but thin:** <claim there but too shallow>
    - **Ungrounded claim:** <doc says X; ledger silent; cyoda-go check inconclusive>

    (if none, write "None.")

Clarity-suggestion calibration (non-negotiable):

A clarity suggestion qualifies only if at least ONE holds:
- A first-time reader would form a materially wrong mental model.
- The page contradicts itself or uses two names for the same thing
  without reconciling them.
- Ordering buries a decision the reader must make before the later
  content is useful.
- A worked example is missing where the surrounding prose assumes one.
- The page makes a strong claim without saying what it's grounded in.

Explicitly NOT qualifying: tone/voice rewrites, synonym preferences,
heading-level cosmetics, sentence polish, caveats for caveats' sake,
adding diagrams for their own sake.

Bucketing guidance:
- **Fix now:** narrative/conceptual content that is factually wrong and
  wouldn't move to help anyway (e.g., a broken example, a contradictory
  paragraph, a wrong behavior statement in prose).
- **Reframe post-#80:** content that stays but needs its reference-ish
  parts replaced with a pointer/callout into `cyoda help <topic>` once
  help ships (e.g., a flag table that duplicates what help will own).
- **Delete post-#80:** pure reference duplication that disappears when
  help lands (e.g., an env-var enumeration that help will own outright
  with no narrative value).

Section summary — also produce sections/<SECTION>.md:

    # <SECTION> section — Wave 2 review summary

    **Pages reviewed:** <count>
    **cyoda-go ref:** <PINNED_SHA>

    ## Posture
    One paragraph: overall correctness across the section.

    ## Per-page bucket counts
    | Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
    |------|---------|------------------|-----------------|---------|
    | ... |

    ## Cross-section issues noticed
    Short bullets: anything that looked like terminology drift,
    duplication, or contradiction spanning into OTHER sections.
    (Intra-section issues are already in the per-page files.)

Output contract — this matters for automated file writing:

Emit ALL output files in ONE response, each preceded by a delimiter line
of the form:

    ===FILE: <exact output path>===

Then the full file content. Then the next delimiter. Example:

    ===FILE: docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__what-is-cyoda.md===
    ---
    page: src/content/docs/concepts/what-is-cyoda.mdx
    ...
    ===FILE: docs/superpowers/reviews/2026-04-22-correctness/pages/concepts__entities-and-lifecycle.md===
    ---
    ...
    ===FILE: docs/superpowers/reviews/2026-04-22-correctness/sections/<SECTION>.md===
    # <SECTION> section ...

No prose outside file blocks. The calling thread will parse the
delimited output and write each file verbatim.
```

---

## Self-review

Applied inline before finalization:

1. **Spec coverage:**
   - Wave 1 (ledger): Task 3. ✓
   - Wave 2 (per-section): Tasks 4–8 cover concepts, build, run, reference, getting-started + root. ✓
   - Wave 3 (consolidation): Tasks 10, 11. ✓
   - Per-page file schema: inlined in the Wave 2 prompt template. ✓
   - Three-bucket taxonomy: inlined in bucketing guidance. ✓
   - Clarity calibration: inlined, with cap at ~5 and structural fallback. ✓
   - Coverage notes: inlined. ✓
   - Cross-cutting doc structure: inlined in Task 10. ✓
   - Artefact layout: matches spec §"Artefact layout". ✓
   - Post-#80 alignment test: pointed to in Task 11's "Next steps" and Task 12's handoff. Not implemented here (it waits on #80); spec §"Post-#80 alignment test" is explicit about it being a future step. ✓
   - Depth requirements (Wave 1 and Wave 2): explicit in both prompts. ✓
   - OSS-only / no cassandra / no cloud: explicit in all prompts and a Task 9 global sweep. ✓
   - No re-derivation of prior review: explicit in every Wave 2 prompt. ✓
   - No docs edits during review: explicit in every Wave 2 prompt. ✓
   - Spec open questions resolved:
     - `src/content/docs/index.mdx` allocation: resolved — paired with getting-started in Task 8. ✓
     - Pinned cyoda-go SHA: resolved — pinned in Task 1, threaded through every Wave 1/2 prompt. ✓
     - Fix-now remediation PR location: resolved — new branch off `feature/cyoda-go-init`, referenced in Task 11's Next-steps and Task 12's handoff. ✓

2. **Placeholder scan:** No TBD/TODO/"fill in later". The only `?` marks are in the Task 11 README index template where numeric counts are computed at runtime — explicitly called out. No vague "add error handling" steps. Every code block contains the actual content the executor needs.

3. **Type/name consistency:**
   - Directory name: `2026-04-22-correctness` consistent throughout.
   - `CYODA_GO_SHA` filename consistent.
   - Page-file naming convention: `<section>__<slug>.md` consistent (double underscore separator). Root page: `root__index.md`.
   - Bucket names: `Fix now`, `Reframe post-#80`, `Delete post-#80` — identical in spec, plan, and subagent prompt template.
   - Frontmatter field names: `page`, `section`, `reviewed_by`, `reviewed_on`, `cyoda_go_ref`, `status` — identical across schema definition and the Task 9 verification grep.
