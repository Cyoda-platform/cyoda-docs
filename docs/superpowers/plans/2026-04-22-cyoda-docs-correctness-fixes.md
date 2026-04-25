# Cyoda-docs correctness fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the 20 Fix-now and 36 clarity remediations from the 2026-04-22 correctness review to the actual cyoda-docs pages, shipping via a PR into `feature/cyoda-go-init`.

**Architecture:** Four phases. Phase 1 cuts a fix branch off `feature/cyoda-go-init`. Phase 2 runs four site-wide sweeps (grep-and-replace or component-wrap patterns that each fix one class of bug across multiple pages in a single commit). Phase 3 applies per-page residuals (Fix-nows and clarity suggestions that don't fit a sweep). Phase 4 verifies the build, runs the link-integrity test, updates the review index/handoff with close-out, and opens the PR.

**Tech Stack:** Astro + Starlight, MDX/Markdown content, Playwright link-integrity test, git. No new code except one small extension to `src/components/VendoredBanner.astro` to add an "upcoming" stability mode for the Trino banner sweep.

**Inputs (the spec):**
- `docs/superpowers/reviews/2026-04-22-correctness/README.md` — index
- `docs/superpowers/reviews/2026-04-22-correctness/ledger.md` — ground truth
- `docs/superpowers/reviews/2026-04-22-correctness/pages/*.md` — 29 per-page reviews
- `docs/superpowers/reviews/2026-04-22-correctness/sections/*.md` — section summaries
- `docs/superpowers/reviews/2026-04-22-correctness/cross-cutting.md` — site-wide synthesis

**Working directory:** `/Users/paul/dev/cyoda-docs/.worktrees/pivot`, base branch `feature/cyoda-go-init`.

**Scope decisions (baked into this plan — override if wrong):**
- Fix-now findings (20) **and** clarity suggestions (36) are both actioned in this PR.
- Reframe-post-#80 items (5) are **deferred** to the post-#80 reframe PR (cyoda-docs #69).
- The one Delete-post-#80 item (time/message triggers in `concepts/workflows-and-events.md`) is **deferred** per the spec default. If this should be actioned now, slot into Task 12 and treat the trigger paragraph deletion as an additional content change.
- Trino is on the roadmap and not yet in OSS at the pinned commit; Trino-bearing pages get an "upcoming" banner (Phase 2 sweep 4) rather than correctness edits against unshipped specifics.

---

## File structure (what changes, and where)

```
src/
  components/
    VendoredBanner.astro              — MODIFY: add 'upcoming' stability mode (Task 6)
  content/docs/
    getting-started/
      install-and-first-entity.mdx    — MODIFY (Tasks 2, 3, 4, 11)
    concepts/
      apis-and-surfaces.md            — MODIFY (Tasks 5, 12)
      authentication-and-identity.md  — MODIFY (Task 12)
      design-principles.mdx           — MODIFY (Task 12)
      workflows-and-events.md         — MODIFY (Task 12; Delete-post-#80 deferred)
    build/
      analytics-with-sql.md           — MODIFY (Task 5: banner only)
      client-compute-nodes.md         — MODIFY (Task 13: clarities only)
      modeling-entities.md            — no changes (only coverage notes; no Fix/clarity)
      searching-entities.md           — MODIFY (Tasks 4, 8)
      testing-with-digital-twins.md   — MODIFY (Tasks 5, 13)
      workflows-and-processors.mdx    — MODIFY (Task 7)
      working-with-entities.md        — MODIFY (Tasks 4, 8)
    run/
      desktop.md                      — MODIFY (Tasks 2, 3, 9)
      docker.md                       — MODIFY (Tasks 2, 9)
      kubernetes.md                   — MODIFY (Task 9: clarities only)
    reference/
      cli.mdx                         — MODIFY (Tasks 3, 10)
      configuration.mdx               — MODIFY (Task 10)
      entity-model-export.mdx         — MODIFY (Task 13: clarities only)
      trino.mdx                       — MODIFY (Task 5: banner + scope note)
```

Not touched by this PR:
- `src/content/docs/{run/cyoda-cloud/**, reference/schemas/**, index.mdx, run/index.mdx, build/index.mdx, reference/index.mdx, reference/api.mdx, reference/helm.mdx, reference/schemas.mdx}` — no Fix-now or qualifying clarity findings.
- `concepts/{what-is-cyoda.mdx, entities-and-lifecycle.md, digital-twins-and-growth-path.mdx}` — clean.

---

## Phase 1 — Branch

### Task 1: Cut the fix branch

**Files:** no file changes; git operation only.

- [ ] **Step 1: Verify base state**

Run:
```bash
cd /Users/paul/dev/cyoda-docs/.worktrees/pivot
git status
git log --oneline -1
```
Expected: clean working tree; HEAD at `30f9424` (the Trino-rework commit) on `feature/cyoda-go-init`.

- [ ] **Step 2: Cut the branch**

```bash
git checkout -b docs/correctness-fixes-2026-04-22
git log --oneline -2
```
Expected: branch `docs/correctness-fixes-2026-04-22` created; HEAD still at `30f9424`.

- [ ] **Step 3: No commit for this task** (branch creation only).

---

## Phase 2 — Site-wide sweeps

Each sweep is a single commit that fixes one class of bug across multiple pages. Order is from smallest blast-radius to largest.

### Task 2: Sweep — `CYODA_STORAGE` → `CYODA_STORAGE_BACKEND`

Affects three pages: `run/desktop.md`, `run/docker.md`, `getting-started/install-and-first-entity.mdx`.

**Why:** `app/config.go:L110` reads `CYODA_STORAGE_BACKEND`. Users typing `export CYODA_STORAGE=postgres` see no effect (wrong var ignored, app falls back to hardcoded default `memory`).

- [ ] **Step 1: Locate every occurrence**

Run:
```bash
grep -rn 'CYODA_STORAGE\b' src/content/docs/
```
Expected: exactly 3 matches. Capture them — they are the only places to change. `\b` excludes `CYODA_STORAGE_BACKEND`, `CYODA_STORAGE_DSN`, etc.

- [ ] **Step 2: Apply the substitution on each match**

For each of the three files, use Edit/sed to replace `CYODA_STORAGE` (word-boundary) with `CYODA_STORAGE_BACKEND`. Exact edits (from the review):

- `src/content/docs/run/desktop.md:L57`: `(\`CYODA_STORAGE\`, listen ports, JWT keys)` → `(\`CYODA_STORAGE_BACKEND\`, listen ports, JWT keys)`
- `src/content/docs/run/docker.md:L41`: `\`CYODA_STORAGE=postgres\`` → `\`CYODA_STORAGE_BACKEND=postgres\``
- `src/content/docs/getting-started/install-and-first-entity.mdx:L126`: `\`CYODA_STORAGE=memory\`` → `\`CYODA_STORAGE_BACKEND=memory\``

- [ ] **Step 3: Verify zero remaining matches**

Run:
```bash
grep -rn 'CYODA_STORAGE\b' src/content/docs/
```
Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/
git commit -m "$(cat <<'EOF'
docs: fix CYODA_STORAGE → CYODA_STORAGE_BACKEND across run and getting-started

The storage backend env var is CYODA_STORAGE_BACKEND
(app/config.go:L110). The incorrect short form was silently
misconfiguring users — the wrong variable is ignored and the app
falls back to the hardcoded default `memory`.

Sweep applied to:
- run/desktop.md:L57
- run/docker.md:L41
- getting-started/install-and-first-entity.mdx:L126

Addresses cross-cutting §4 of the 2026-04-22 correctness review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Sweep — `cyoda serve` → `cyoda`

Affects four occurrences across three pages: `run/desktop.md:L45`, `reference/cli.mdx:L21`, `getting-started/install-and-first-entity.mdx:L43, L56`.

**Why:** `cmd/cyoda/main.go:L36-48` recognizes only `--help`/`-h`, `init`, `health`, `migrate`. The server is started by running the binary with no subcommand. `cyoda serve` "works" today via fall-through (the `serve` arg is ignored) but is not documented and would break if a real `serve` subcommand shipped.

- [ ] **Step 1: Locate every occurrence**

```bash
grep -rn 'cyoda serve' src/content/docs/
```
Expected: exactly 4 matches across 3 files.

- [ ] **Step 2: Apply substitutions with surrounding wording fixups**

Edits are not a pure `s/cyoda serve/cyoda/` — adjacent prose often reads awkwardly after the replacement. Apply these specific edits:

- `src/content/docs/run/desktop.md:L45`: the code block shows `cyoda serve`. Change to just `cyoda`.
- `src/content/docs/reference/cli.mdx:L21`: `serving (\`cyoda serve\`)` → `serving (run \`cyoda\` with no subcommand — the default)`.
- `src/content/docs/getting-started/install-and-first-entity.mdx:L43`: the code block shows `cyoda serve`. Change to just `cyoda`.
- `src/content/docs/getting-started/install-and-first-entity.mdx:L56`: `\`cyoda serve\` defaults to **mock auth**` → `Running \`cyoda\` (no subcommand) defaults to **mock auth**`.

- [ ] **Step 3: Verify zero remaining matches**

```bash
grep -rn 'cyoda serve' src/content/docs/
```
Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/
git commit -m "$(cat <<'EOF'
docs: remove phantom `cyoda serve` subcommand

cyoda-go has no `serve` subcommand. cmd/cyoda/main.go:L36-48
handles only --help, -h, init, health, migrate. `cyoda serve`
works today via fall-through (the `serve` arg is silently
ignored) but is undocumented and would break if a real `serve`
subcommand shipped.

Sweep applied to four occurrences in three files:
- run/desktop.md:L45
- reference/cli.mdx:L21
- getting-started/install-and-first-entity.mdx:L43, L56

Addresses cross-cutting §3 of the 2026-04-22 correctness review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Sweep — `/api/models/...` → `/api/entity/...` and `/api/search/...`

Affects three pages: `build/working-with-entities.md`, `build/searching-entities.md`, `getting-started/install-and-first-entity.mdx`. Not a pure `s/...//` because the canonical endpoints take a `{format}` path param and in the search case the job-id parameter name changes.

**Why:** `api/openapi.yaml` defines `/entity/{format}/{entityName}/{modelVersion}` (create), `/entity/{entityId}` (get by UUID), `/entity/{format}/{entityId}/{transition}` (named transition), `/entity/{entityName}/{modelVersion}` (list), `/search/direct/{entityName}/{modelVersion}`, `/search/async/{entityName}/{modelVersion}`, `/search/async/{jobId}`, `/search/async/{jobId}/status`, `/search/async/{jobId}/cancel`, `/search/async/{jobId}/results`. No `/api/models/...` path exists.

- [ ] **Step 1: Locate every occurrence**

```bash
grep -rn '/api/models/' src/content/docs/
grep -rn '/api/search/\{searchId' src/content/docs/
grep -rn '{searchId}' src/content/docs/
```
Expected counts: `/api/models/` ≈ 10+ across the three files; `searchId` ≈ 3+ in `build/searching-entities.md`.

- [ ] **Step 2: Apply per-page edits from the review findings**

`src/content/docs/build/working-with-entities.md` (per review F1–F4):

- `curl -X POST http://localhost:8080/api/models/orders/entities \` → `curl -X POST http://localhost:8080/api/entity/JSON/orders/1 \`
- `curl http://localhost:8080/api/models/orders/entities/ORD-42 \` → `curl http://localhost:8080/api/entity/{entityId} \` (with inline note that `{entityId}` is the UUID returned from create, not the business ID)
- `POST /api/models/orders/entities/ORD-42/transitions/submit` → `POST /api/entity/JSON/{entityId}/submit`
- List example `GET /api/models/orders/entities?state=submitted&customerId=CUST-7` → rewrite to either `GET /api/entity/orders/1` (plain list; filter query params not documented on this endpoint in OSS) or redirect to the search endpoints for filtered reads. Preferred rewrite: replace the filter example with a short pointer: "Filtered reads go through search — see `build/searching-entities.md`." Drop the query-parameter claim.

`src/content/docs/build/searching-entities.md` (per review F1–F4):

- `curl -X POST http://localhost:8080/api/models/orders/search \` → `curl -X POST http://localhost:8080/api/search/direct/orders/1 \`
- Async submit: `/api/models/orders/search` (same pattern) → `/api/search/async/orders/1`
- Status: `GET /api/search/{searchId}/status` → `GET /api/search/async/{jobId}/status`
- Results: `GET /api/search/{searchId}/results?page=0` → `GET /api/search/async/{jobId}/results?pageNumber=0&pageSize=1000` (note: `pageNumber` not `page`)
- Add cancellation section (F4): append a short "Cancelling a job" subsection with `DELETE /api/search/async/{jobId}/cancel`.
- Rename `{searchId}` → `{jobId}` everywhere else it appears.

`src/content/docs/getting-started/install-and-first-entity.mdx` (per review F2):

- L50 `curl -X POST http://localhost:8080/api/models/orders/entities \` → `curl -X POST http://localhost:8080/api/entity/JSON/orders/1 \`
- L98 `curl -X POST http://localhost:8080/api/models/orders/entities/ORD-1/transitions/submit` → `curl -X POST http://localhost:8080/api/entity/JSON/${ENTITY_ID}/submit` with an earlier step that captures the UUID from the create response into `ENTITY_ID`.
- L106 `curl http://localhost:8080/api/models/orders/entities/ORD-1` → `curl http://localhost:8080/api/entity/${ENTITY_ID}`

Add a brief note near the first POST explaining that the `{entityId}` used in GET/transition is the UUID returned by the create response (JSON `entityIds[0]`), not the business key like `orderId`.

- [ ] **Step 3: Verify zero remaining matches**

```bash
grep -rn '/api/models/' src/content/docs/
grep -rn '{searchId}' src/content/docs/
```
Expected: zero matches for both.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/
git commit -m "$(cat <<'EOF'
docs: correct REST endpoint paths — /api/models/... → /api/entity/... and /api/search/...

The documented endpoint pattern /api/models/{entityName}/entities
does not exist in cyoda-go. Canonical paths per api/openapi.yaml:
  - /entity/{format}/{entityName}/{modelVersion} (POST create)
  - /entity/{entityId} (GET by UUID)
  - /entity/{format}/{entityId}/{transition} (POST named transition)
  - /entity/{entityName}/{modelVersion} (GET list)
  - /search/direct/{entityName}/{modelVersion}
  - /search/async/{entityName}/{modelVersion}
  - /search/async/{jobId}, /status, /results, /cancel

Also corrected the parameter name on async search from
{searchId} to {jobId}, matched the handler signatures, and added
a short note that entity URLs use the UUID returned by create,
not the business key.

Applied to:
- build/working-with-entities.md
- build/searching-entities.md
- getting-started/install-and-first-entity.mdx

Addresses cross-cutting §2 of the 2026-04-22 correctness review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Sweep — Trino "upcoming" banner (prep: extend VendoredBanner)

This sweep has two parts: extend the banner component (Task 5a), then apply it to four pages (Task 5b). Split into two commits.

#### Task 5a: Add `'upcoming'` stability mode to `VendoredBanner.astro`

**Files:**
- Modify: `src/components/VendoredBanner.astro`

- [ ] **Step 1: Read current file for exact context**

The current component is 46 lines. Add a new branch to the stability switch, and a paired style rule for the new data-stability value.

- [ ] **Step 2: Apply the edit**

In `src/components/VendoredBanner.astro`:

1. In the TypeScript interface block, extend the `stability` union:
   ```ts
   stability?: 'stable' | 'evolving' | 'awaiting-upstream' | 'upcoming';
   ```
2. After the `evolving` branch inside the `aside`, add an `upcoming` branch:
   ```astro
   {stability === 'upcoming' && (
     <><strong>Upcoming.</strong> This describes a feature on the roadmap; it is not yet available in cyoda-go at this release. Names and shapes may change before release.</>
   )}
   ```
3. In the `<style>` block, add a rule analogous to the awaiting-upstream one:
   ```css
   .vendored-banner[data-stability='upcoming'] {
     border-left-color: hsl(var(--cyoda-blue, 210 80% 55%));
     background: hsl(var(--cyoda-blue, 210 80% 55%) / 0.08);
   }
   ```

If `--cyoda-blue` is not defined in the site's tokens, use a literal `hsl(210 80% 55%)` fallback — the style block already uses `hsl(var(--cyoda-orange))` and `hsl(var(--cyoda-purple))` for the other variants, so follow that pattern; the `var(..., fallback)` form above accommodates either case.

- [ ] **Step 3: Verify component still compiles (smoke build)**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -20
```
Expected: build completes without errors referencing `VendoredBanner`.

- [ ] **Step 4: Commit**

```bash
git add src/components/VendoredBanner.astro
git commit -m "$(cat <<'EOF'
feat(components): add 'upcoming' stability mode to VendoredBanner

For pages documenting roadmap features not yet in the pinned
cyoda-go release (Trino, initially). Renders a banner stating
the feature is forthcoming and specifics may change before
release.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### Task 5b: Apply the `upcoming` banner to Trino-bearing pages

**Files:**
- Modify: `src/content/docs/concepts/apis-and-surfaces.md` (Trino section only)
- Modify: `src/content/docs/build/analytics-with-sql.md` (top of page)
- Modify: `src/content/docs/build/testing-with-digital-twins.md` (short inline callout at the line mentioning Trino)
- Modify: `src/content/docs/reference/trino.mdx` (replace/align with existing awaiting-upstream banner)

- [ ] **Step 1: Apply banner to each file**

The banner usage, at the top of each page or directly above a Trino-only section, is:

```astro
import VendoredBanner from '../../../components/VendoredBanner.astro';

<VendoredBanner stability="upcoming" />
```

(Relative import path adjusted per file's depth: `build/` and `run/` pages use `../../../components/`; `concepts/` and `reference/` use `../../../components/` too. For `.md` files that don't currently include Astro imports, convert the file to `.mdx` **only if** it doesn't already have an import; otherwise add a simple block-quote banner. Check the file extension before choosing approach.)

Per file:

- `src/content/docs/concepts/apis-and-surfaces.md` (`.md`): already a Markdown file without Astro imports. Two options: (a) rename to `.mdx` and add the component; (b) add a plain Markdown block-quote banner. Prefer (b) for minimal diff:
  ```markdown
  :::caution[Upcoming]
  Trino SQL is on the roadmap and not yet available in cyoda-go at this release. The section below documents the planned surface; names and shapes may change before release.
  :::
  ```
  Place this directly above the `## Trino SQL: cross-entity analytics` heading (around L56). Starlight's MD pipeline supports the `:::caution[Title]` container syntax.

- `src/content/docs/build/analytics-with-sql.md` (`.md`): entire page is about Trino. Place the same `:::caution[Upcoming]` block at the very top of the page body (after the frontmatter).

- `src/content/docs/build/testing-with-digital-twins.md` (`.md`): small inline mention. Do NOT add a page-wide banner. Instead rewrite the sentence `"same API contracts (REST, gRPC, Trino)"` → `"same API contracts (REST, gRPC today; Trino upcoming — see the [Trino reference](/reference/trino/))"`.

- `src/content/docs/reference/trino.mdx` (`.mdx`): check whether `VendoredBanner` is already imported and used with `stability="awaiting-upstream"`. If yes, change that to `stability="upcoming"` (and drop `issue` prop if present — this is a roadmap feature banner, not an awaiting-upstream-issue banner). If it's a different banner pattern, import `VendoredBanner` and add `<VendoredBanner stability="upcoming" />` at the top of the content, below the frontmatter.

- [ ] **Step 2: Smoke-build**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -20
```
Expected: build completes without errors.

- [ ] **Step 3: Verify visible text**

```bash
grep -n 'Upcoming\|upcoming' src/content/docs/concepts/apis-and-surfaces.md src/content/docs/build/analytics-with-sql.md src/content/docs/reference/trino.mdx
```
Expected: each file has at least one match; banner text or callout present.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/concepts/apis-and-surfaces.md src/content/docs/build/analytics-with-sql.md src/content/docs/build/testing-with-digital-twins.md src/content/docs/reference/trino.mdx
git commit -m "$(cat <<'EOF'
docs: add 'upcoming' banner to Trino-bearing pages

Trino SQL is on the roadmap and not yet callable at the pinned
cyoda-go commit. Add an explicit "upcoming / roadmap" banner so
readers know the specifics may change before release.

Applied to:
- concepts/apis-and-surfaces.md (:::caution[Upcoming] above the Trino section)
- build/analytics-with-sql.md (:::caution[Upcoming] at top of page)
- build/testing-with-digital-twins.md (inline rephrase flagging Trino as upcoming)
- reference/trino.mdx (switch VendoredBanner stability from awaiting-upstream to upcoming)

Addresses cross-cutting §1 of the 2026-04-22 correctness review.
Correctness of the documented Trino specifics (JDBC URL pattern,
catalog layout, AS OF equivalent, projection rules) will be
re-reviewed once the feature ships.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Per-page residuals (Fix-now + clarity)

Each task handles one page. Tasks are sized so a subagent can read the relevant review file and apply the edits in one pass.

### Task 6: reserved / not used

(Task 5 expanded into 5a + 5b. Keeping numbering continuous for external references.)

### Task 7: `build/workflows-and-processors.mdx`

**Files:**
- Modify: `src/content/docs/build/workflows-and-processors.mdx`

Review file: `docs/superpowers/reviews/2026-04-22-correctness/pages/build__workflows-and-processors.md`.

- [ ] **Step 1: Apply F1 — workflow version field**

Find every JSON example with `"version": "1.0"` (or other decimal form) and change to `"version": "1"` (integer string). Per `internal/domain/workflow/default_workflow.json:L1-2`.

```bash
grep -n '"version"' src/content/docs/build/workflows-and-processors.mdx
```

Expected: 1+ matches with decimal form. Replace each with `"1"`.

- [ ] **Step 2: Apply F2 — cascade depth vs state visit clarity**

Find the section describing `CYODA_MAX_STATE_VISITS` (search for `MAX_STATE_VISITS` in the file). Add a sentence clarifying that this variable configures only the per-state visit limit and that there is also a hard-coded absolute cascade-depth cap of 100 in `internal/domain/workflow/engine.go:L31` (`maxCascadeDepth`). Exact wording (drop-in sentence):

> `CYODA_MAX_STATE_VISITS` configures the per-state visit limit within a single cascade (default 10). A separate hard-coded safety cap of 100 steps limits total cascade depth across all states, preventing runaway automatic-transition chains.

- [ ] **Step 3: Apply C1 — workflow selection order**

In the "Multiple Workflows per Model" section, add one sentence: "The platform evaluates active workflows in the order they are defined and uses the first whose criterion matches (or the first with no criterion, which matches unconditionally)."

- [ ] **Step 4: Apply C2 — processor idempotency note**

In the processor execution modes section, add one sentence after the ASYNC_NEW_TX description: "Processors should be idempotent; failed ASYNC_NEW_TX processors may be retried."

- [ ] **Step 5: Smoke-build**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
```
Expected: build completes.

- [ ] **Step 6: Commit**

```bash
git add src/content/docs/build/workflows-and-processors.mdx
git commit -m "$(cat <<'EOF'
docs(build): correct workflow version + cascade-depth framing

- F1: workflow JSON `version` is "1" (integer string), not "1.0".
  Per internal/domain/workflow/default_workflow.json:L1-2.
- F2: CYODA_MAX_STATE_VISITS configures only the per-state visit
  limit (default 10). Document the separate hard-coded absolute
  cascade-depth cap of 100 at internal/domain/workflow/engine.go:L31.
- C1: Workflow selection is first-match-in-declaration-order; state
  that explicitly.
- C2: Processors should be idempotent; ASYNC_NEW_TX failures may be
  retried.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `build/working-with-entities.md` + `build/searching-entities.md` — non-sweep residuals

**Files:**
- Modify: `src/content/docs/build/working-with-entities.md`
- Modify: `src/content/docs/build/searching-entities.md`

Review files: `pages/build__working-with-entities.md`, `pages/build__searching-entities.md`.

Note: the endpoint-path findings (F1–F4 on both pages) were resolved in Task 4. This task handles the non-sweep items: F5 on each page (Reframe post-#80 — **skipped** this PR), and all clarity suggestions.

- [ ] **Step 1: Apply `working-with-entities.md` clarity suggestions**

- **C1 — direct vs. immediate naming.** Search the page for "Immediate" or "immediate" as a description of synchronous search. Replace with consistent `direct` (API term) usage. Minimal edit: replace the single occurrence of `"Immediate (API term: \`direct\`)"` with just `"Direct (synchronous, capped result size)"` and update any subsequent prose that uses "immediate" to "direct".

- **C2 — missing transition payload example.** In the Update section that mentions "invoking the `submit` transition", add a minimal worked example showing the POST body (or stating that the transition takes no body, whichever matches the openapi). Grounded from `api/openapi.yaml` at `/entity/{format}/{entityId}/{transition}`: check whether the request body is empty or entity-JSON. Add one of:
  - If no body: `# No request body required for a transition.` as a comment in the curl example.
  - If optional entity JSON: a minimal `{"reason": "reviewed"}` example body with a note that the body is passed to processors as context.

- [ ] **Step 2: Apply `searching-entities.md` clarity suggestions**

- **C1 — point-in-time semantics.** Add the sentence: "Each entity maintains a history of revisions; point-in-time queries return results using the entity state that was current at the specified timestamp."
- **C2 — paging semantics on async search.** Verify whether `pageSize` is a submission parameter or a result-fetch parameter against `api/openapi.yaml`. Update the prose to match: in the current ledger it is a query parameter on the results endpoint (fetch-time), not submission-time. Update "pageSize is set at submission time" → "pageSize applies at result-fetch time via query parameters on `/search/async/{jobId}/results`".
- **C3 — sort order specification.** Add a minimal worked example of the sort-keys JSON shape in the request body, or a short note that sort is specified via a `sort` array in the submission JSON (confirm against openapi). If openapi does not document sort, replace the "Sort keys go in the submission body" sentence with "Sort is not yet documented on the REST async surface; results are returned in insertion order for the pinned release."

- [ ] **Step 3: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/build/working-with-entities.md src/content/docs/build/searching-entities.md
git commit -m "$(cat <<'EOF'
docs(build): clarity fixes on working-with-entities and searching-entities

working-with-entities.md:
- C1: use "direct" consistently for synchronous search (not "immediate")
- C2: add minimal transition payload guidance

searching-entities.md:
- C1: explain point-in-time in terms of revision history
- C2: paging parameters apply at result-fetch time, not submission
- C3: clarify sort specification (or note absence)

Endpoint-path Fix-nows (F1–F4 on both pages) were handled by the
site-wide /api/models/... sweep (Task 4). F5 Reframe-post-#80
items (PATCH clarification; operator-grammar pointer) are deferred
to the post-#80 reframe PR per cyoda-docs #69.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `run/` per-page residuals and clarities

**Files:**
- Modify: `src/content/docs/run/desktop.md`
- Modify: `src/content/docs/run/docker.md`
- Modify: `src/content/docs/run/kubernetes.md`

Review files: `pages/run__desktop.md`, `pages/run__docker.md`, `pages/run__kubernetes.md`.

`CYODA_STORAGE` and `cyoda serve` were fixed by sweeps (Tasks 2 and 3). This task handles the remaining items.

- [ ] **Step 1: `run/desktop.md` — F3, C1, C2**

- **F3 (Reframe post-#80 — deferred):** skip. No action this PR.
- **C1 — Upgrade-path ordering.** Reorder so "When you outgrow desktop" comes before "Upgrading".
- **C2 — SQLite single-writer durability note.** Add one sentence where SQLite durability is mentioned: "SQLite is single-writer; all writes serialize through the database file, which limits concurrent write throughput."

- [ ] **Step 2: `run/docker.md` — C1, C2, C3**

- **C1 — Postgres DSN mechanism.** Where `CYODA_STORAGE_BACKEND=postgres` is mentioned (L41 after Task 2's sweep), add a sentence: "The DSN goes in `CYODA_POSTGRES_URL` (or `CYODA_POSTGRES_URL_FILE` for a file-mounted secret per Docker conventions)."
- **C2 — Health probes.** In the observability section, add one sentence: "Health probes live on the admin port (default 9091): `/livez` (liveness) and `/readyz` (readiness). Both are unauthenticated."
- **C3 — Data directory.** Add a brief note about `/var/lib/cyoda` as the pre-staged data directory, and that it should be mounted as a named volume to persist SQLite or any plugin state across container restarts.

- [ ] **Step 3: `run/kubernetes.md` — C1, C2, C3**

- **C1 — HMAC secret GitOps coupling.** Add one paragraph near the secrets discussion: "The Helm chart auto-generates the HMAC secret unless `cluster.hmacSecret.existingSecret` is provided. GitOps deployments should always set `existingSecret` to avoid Helm rendering a fresh secret on every reconcile, which would cause inter-node auth to drift."
- **C2 — Migrations ordering.** Add one sentence: "The Helm chart runs schema migrations as a pre-install/pre-upgrade hook; pod startup is blocked until migrations complete."
- **C3 — Coordination mechanism.** Add one sentence to the "no leader election" paragraph: "Coordination happens through PostgreSQL's SERIALIZABLE isolation for writes and a gossip protocol (HMAC-authenticated) for membership."

Also update the Helm-chart-reference note (L54-57 per the review) to point at `/reference/helm/` directly rather than the forward-looking placeholder.

- [ ] **Step 4: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/run/desktop.md src/content/docs/run/docker.md src/content/docs/run/kubernetes.md
git commit -m "$(cat <<'EOF'
docs(run): clarities on desktop, docker, kubernetes

desktop.md:
- C1: reorder growth-path warning before upgrade mechanics
- C2: note SQLite single-writer concurrency limit

docker.md:
- C1: point Postgres DSN to CYODA_POSTGRES_URL / *_FILE
- C2: mention /livez and /readyz on admin port 9091
- C3: note /var/lib/cyoda data directory and volume mounting

kubernetes.md:
- C1: HMAC secret GitOps coupling (existingSecret required)
- C2: Helm pre-install/pre-upgrade migration hook
- C3: coordination mechanism (Postgres SERIALIZABLE + gossip)
- link updated to point at /reference/helm/ directly

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `reference/cli.mdx` + `reference/configuration.mdx`

**Files:**
- Modify: `src/content/docs/reference/cli.mdx`
- Modify: `src/content/docs/reference/configuration.mdx`

Review files: `pages/reference__cli.md`, `pages/reference__configuration.md`.

`cyoda serve` was fixed by the Task 3 sweep. This task handles the remaining items.

- [ ] **Step 1: `reference/cli.mdx` — C1 subcommand table**

Add a short Subcommands table below the introductory prose (and above the `awaiting-upstream` banner's message, or after it, per page flow):

```markdown
## Subcommands

| Command | Purpose |
|---------|---------|
| `cyoda` | Start the server (default; no subcommand). |
| `cyoda --help` / `-h` | Print help and exit. |
| `cyoda init [--force]` | Write starter user config (SQLite default). Idempotent unless `--force`. |
| `cyoda health` | Probe `/readyz` on the admin port; exit 0 on 200, 1 otherwise. |
| `cyoda migrate [--timeout <duration>]` | Run storage-plugin migrations (no-op for memory / sqlite; Postgres runs plugin migrations). |

Subcommand flags are operation-specific; they do not override server-runtime configuration (which comes from environment variables and `.env` files — see [Reference → Configuration](/reference/configuration/)).
```

- [ ] **Step 2: `reference/configuration.mdx` — F1, F2, C1, C2**

- **F1 — Remove TOML/YAML and `--config` claims.** Find the bullet or sentence listing "Config file — TOML/YAML at a default path, or passed via `--config`." Replace with: "Config files — `.env`-format only (godotenv-parsed). Loaded from system path, user path, and `.env` / `.env.{profile}` in the project directory. No TOML/YAML and no `--config` flag."

- **F2 — Fix CLI-flags precedence mischaracterization.** Replace the "CLI flags — the highest-precedence override for any single run." bullet with:
  > Configuration precedence (highest to lowest): shell environment > `.env.{profile}` > `.env` > user config > system config > hardcoded defaults. (Subcommands like `cyoda init` accept operation-specific flags that do NOT override server-runtime configuration.)

- **C1 — Profile loading detail.** Add one sentence: "`CYODA_PROFILES` is comma-separated and evaluated in declaration order; later profiles override earlier ones (within a profile, regular `.env`-precedence applies)."

- **C2 — Config location OS-specificity.** Add a short note listing per-OS user-config paths. For example:
  > User config paths vary by OS: Linux/macOS `~/.config/cyoda/cyoda.env` (XDG), Windows `%AppData%\cyoda\cyoda.env`. System config lives at `/etc/cyoda/cyoda.env` on POSIX.

(If the exact paths are uncertain, grep `cmd/cyoda/init.go` to confirm before writing them.)

- [ ] **Step 3: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/reference/cli.mdx src/content/docs/reference/configuration.mdx
git commit -m "$(cat <<'EOF'
docs(reference): fix CLI and Configuration factual errors

reference/cli.mdx:
- C1: add Subcommands table listing the real set
  (cyoda | init | health | migrate)

reference/configuration.mdx:
- F1: remove unsupported TOML/YAML config-file and --config flag
  claims. cyoda-go loads only .env-format files (godotenv).
- F2: fix precedence framing. Only subcommands accept flags; the
  server process has no CLI-flag config override.
- C1: document CYODA_PROFILES declaration-order evaluation.
- C2: list per-OS user-config paths.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `getting-started/install-and-first-entity.mdx` — non-sweep residuals

**Files:**
- Modify: `src/content/docs/getting-started/install-and-first-entity.mdx`

Review file: `pages/getting-started__install-and-first-entity.md`.

Endpoint paths (F2), `cyoda serve` (F1), and `CYODA_STORAGE` (F4) were fixed by sweeps (Tasks 4, 3, 2). This task handles F3, F5 (deferred), and clarities.

- [ ] **Step 1: F3 — align example workflow with the default, or add an import step**

Two options. Pick one and apply consistently:

- **Option A (preferred):** Add an explicit step before the entity creation that imports the custom workflow. Wording: "Before creating your first entity, import the workflow so the platform knows the state machine to apply. `POST /api/model/workflow/import` with the workflow JSON body." Keep `"initialState": "draft"` in the workflow example. This preserves the pedagogical value of the custom example and makes the flow correct end-to-end.
- **Option B (simpler):** Remove the custom workflow entirely and narrate around the default workflow (`NONE → CREATED → DELETED`). Replace the example JSON block with a short "cyoda-go ships with a default workflow that applies when no custom workflow is imported: `NONE → CREATED → DELETED`" paragraph, and show the single manual transition (the default has transitions out of `NONE` and `CREATED`).

Default Option A. If Option A is chosen, also add the cascade-behavior clarity: "Automatic transitions (`manual: false`) fire immediately on creation, cascading the entity through applicable states until it reaches one with no outgoing auto transitions."

- **Step 2: F5 Homebrew postinstall claim — Reframe post-#80, deferred**

Skip. No edit this PR.

- **Step 3: C1 — Business-ID vs UUID confusion**

Task 4's sweep already introduced an `ENTITY_ID` variable and brief note explaining the UUID-vs-business-key distinction. Verify that's in place; if not, add a short inline sentence at the first GET/transition example: "`{entityId}` in the URL is the system-assigned UUID returned by the create response (in the `entityIds` array), not the business key like `orderId`."

- **Step 4: C2 — Workflow import step in narrative order**

Covered by Option A in Step 1. If Option B was chosen, C2 doesn't apply.

- **Step 5: C3 — Automatic-transition cascade behavior**

Covered by the clarifying sentence added in Step 1.

- [ ] **Step 6: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/getting-started/install-and-first-entity.mdx
git commit -m "$(cat <<'EOF'
docs(getting-started): align workflow example with engine behavior

- F3: add an explicit workflow-import step before entity creation,
  so the example's initialState:"draft" is actually what the
  engine applies (not the default NONE→CREATED→DELETED).
- C1: clarify that {entityId} in REST URLs is the UUID returned by
  create, not the business key like orderId (complementing the
  sweep in Task 4).
- C2: narrative order now (1) import workflow → (2) create entity →
  (3) observe cascade → (4) manual transition.
- C3: note that automatic transitions fire on creation and cascade
  through applicable states.

F5 (Homebrew postinstall claim) deferred to post-#80 reframe PR.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: concepts — clarity bundle

**Files:**
- Modify: `src/content/docs/concepts/apis-and-surfaces.md`
- Modify: `src/content/docs/concepts/authentication-and-identity.md`
- Modify: `src/content/docs/concepts/design-principles.mdx`
- Modify: `src/content/docs/concepts/workflows-and-events.md`

Review files in `pages/concepts__*.md`.

Trino banner on `apis-and-surfaces.md` was applied in Task 5b. Delete-post-#80 on `workflows-and-events.md` is deferred. This task is clarity-only.

- [ ] **Step 1: `concepts/apis-and-surfaces.md` — C1 decision-first ordering**

Reorder so the "Which surface, when?" (decision-matrix) section appears at the top, above the per-surface detail descriptions. The detail sections stay intact; only the top-level ordering changes.

- [ ] **Step 2: `concepts/authentication-and-identity.md` — C1 subject-token mechanics**

Add one sentence to the on-behalf-of exchange paragraph: "In practice, the calling service includes the user's JWT as the `subject_token` in a token-exchange request; the issued token carries both identities for downstream authorization."

- [ ] **Step 3: `concepts/design-principles.mdx` — C1 clock-tick example**

Replace the "clock tick" example (and any sibling time/message-trigger examples) in the "events drive the machine" area with an implemented-today example. Wording: replace `"'clock tick'"` (and similar) with `"'workflow processor callback'"` or another processor-driven event. If time/message triggers ship via the roadmap, this line can be restored post-delivery.

- [ ] **Step 4: `concepts/workflows-and-events.md` — C1 processor atomicity modes**

Add a short paragraph to the processors section: "Processors run in one of three modes: SYNC (inline, shares the transition's transaction — failure aborts the transition), ASYNC_SAME_TX (runs asynchronously but in the same transaction context — failure still aborts), or ASYNC_NEW_TX (runs in a separate transaction via savepoint isolation — failure is logged and the transition succeeds). Choose the mode based on how atomically the side-effect must compose with the state change."

Note: the Delete-post-#80 item on this page (time/message trigger paragraphs) is **not** actioned here. That stays for the post-#80 reframe PR.

- [ ] **Step 5: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/concepts/apis-and-surfaces.md src/content/docs/concepts/authentication-and-identity.md src/content/docs/concepts/design-principles.mdx src/content/docs/concepts/workflows-and-events.md
git commit -m "$(cat <<'EOF'
docs(concepts): clarity bundle

- apis-and-surfaces: reorder to put surface-selection decision
  first, before per-surface detail.
- authentication-and-identity: explain subject_token mechanics
  for on-behalf-of token exchange.
- design-principles: replace "clock tick" event example with an
  implemented-today trigger.
- workflows-and-events: document the three processor execution
  modes and their atomicity contracts.

Trino-upcoming banner on apis-and-surfaces was applied in Task 5.
The Delete-post-#80 item (time/message trigger paragraphs) is
deferred to the post-#80 reframe PR per cyoda-docs #69.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: build (non-sweep clarities) + reference clarities

**Files:**
- Modify: `src/content/docs/build/client-compute-nodes.md`
- Modify: `src/content/docs/build/testing-with-digital-twins.md`
- Modify: `src/content/docs/reference/entity-model-export.mdx`

Review files: `pages/build__client-compute-nodes.md`, `pages/build__testing-with-digital-twins.md`, `pages/reference__entity-model-export.md`.

- [ ] **Step 1: `build/client-compute-nodes.md` — C1, C2**

- **C1 — language-agnostic auth-attribute extraction.** In section 8.3 (Extracting Auth Context), after the Java snippet, add one sentence: "The exact accessor depends on your gRPC tooling — in Go, use the generated message's `GetAttributes()` method; in Python, dict-like indexing on `.attributes`. See your language's generated proto bindings."
- **C2 — keep-alive timing interaction.** In the Timing parameters table's surrounding prose, add one sentence explaining how the values compose: "A member is marked not alive when a probe times out (`probe timeout`, default 1000ms) and the idle interval (`idle timeout`, default 3000ms) has been exceeded since the last successful probe."

- [ ] **Step 2: `build/testing-with-digital-twins.md` — C1, coverage**

- **C1 — digital twin terminology clarification.** Add a sentence at the top of the page: "In Cyoda, a 'digital twin' means the same application code (workflows, criteria, processors) runs identically on every storage tier. Non-functional properties (persistence, latency, concurrency model) differ; business logic does not."
- **Coverage — in-memory config.** Add a concrete config line: "Set `CYODA_STORAGE_BACKEND=memory` or leave unconfigured (memory is the application default until `cyoda init` is run)."

(C2 — the Trino-upcoming rephrase — was handled in Task 5b.)

- [ ] **Step 3: `reference/entity-model-export.mdx` — C1, C2, C3**

- **C1 — Array descriptor notation.** At first use of the `(TYPE x WIDTH)` notation, add a brief inline definition: "(where TYPE is the element type and WIDTH is the array length; e.g., `(INT x 4)` is a four-element integer array)."
- **C2 — Detached array rule consistency.** Unify the two statements ("multidimensional arrays beyond the first dimension" vs "arrays of arrays create separate nodes") into a single canonical rule: "Arrays of arrays (multidimensional arrays beyond the first dimension) create detached array nodes — each inner array becomes its own node in the export tree." Remove the redundant second statement.
- **C3 — Polymorphic ordering precision.** Replace "roughly: more specific types first, `STRING` last" with the exact ordering rule if it can be cited to a specific file in cyoda-go; otherwise keep the "roughly" but add a pointer to the source (e.g., "see `internal/domain/model/types.go:ComparableDataType` for the authoritative ordering").

- [ ] **Step 4: Smoke-build and commit**

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build:only 2>&1 | tail -10
git add src/content/docs/build/client-compute-nodes.md src/content/docs/build/testing-with-digital-twins.md src/content/docs/reference/entity-model-export.mdx
git commit -m "$(cat <<'EOF'
docs: clarity fixes on compute nodes, digital-twin testing, entity-model export

build/client-compute-nodes.md:
- C1: note language-specific attribute-accessor variation
- C2: explain keep-alive probe + idle timeout interaction

build/testing-with-digital-twins.md:
- C1: clarify "digital twin" = same code, different tier
- Coverage: show CYODA_STORAGE_BACKEND=memory explicitly

reference/entity-model-export.mdx:
- C1: inline-define the (TYPE x WIDTH) array notation
- C2: unify the detached-array rule into one canonical statement
- C3: pin polymorphic ordering to ComparableDataType source

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Verification and PR

### Task 14: Full build, markdown export, link-integrity test

- [ ] **Step 1: Full production build**

```bash
cd /Users/paul/dev/cyoda-docs/.worktrees/pivot
ASTRO_TELEMETRY_DISABLED=1 npm run build
```
Expected: `dist/` populated; schema pages, markdown export, llms.txt, schemas.zip all produced without errors.

- [ ] **Step 2: Run link-integrity test**

```bash
npx playwright test tests/link-integrity.spec.ts
```
Expected: all internal links resolve; no broken anchors. If a Trino-related internal link from `modeling-entities.md` to `/reference/trino/` was previously resolving against an `awaiting-upstream` banner, it should still resolve after the banner change to `upcoming`.

- [ ] **Step 3: Run full Playwright suite**

```bash
GA_MEASUREMENT_ID=dummy npm test
```
Expected: all tests pass (GDPR + GA tests untouched by this PR).

- [ ] **Step 4: If anything fails**

Investigate. Common failure modes:
- Broken MDX due to missing component import — check the file that was edited in Task 5b for the Trino banner; ensure imports are correct for `.mdx` and Starlight `:::caution[Title]` syntax for `.md`.
- Broken anchor — a section heading was renamed during clarity reorder (Task 12 Step 1). Update any incoming anchor link.
- Component prop-validation error — `VendoredBanner stability="upcoming"` missing from the union; re-check Task 5a.

Fix issues, re-run tests, continue.

- [ ] **Step 5: No commit for this task** unless fixes were applied in Step 4, in which case commit with message "docs: fix build/test regressions from correctness-fixes PR".

---

### Task 15: Update the review index with close-out

**Files:**
- Modify: `docs/superpowers/reviews/2026-04-22-correctness/README.md`

- [ ] **Step 1: Add a "Remediation status" section to the README**

Insert above the existing "Next steps" section:

```markdown
## Remediation status

As of the `docs/correctness-fixes-2026-04-22` PR (merged <date>):

- **Fix-now findings actioned:** 20 / 20 (sweeps + per-page residuals).
- **Clarity suggestions actioned:** 36 / 36.
- **Reframe post-#80:** 5 enumerated; deferred to the post-#80 reframe PR (cyoda-docs #69).
- **Delete post-#80:** 1 enumerated (`concepts/workflows-and-events.md` time/message triggers); deferred.

Per-page files under `pages/` are historical records — they do **not** get updated to reflect applied fixes; the authoritative "is it fixed?" answer lives in the remediation PR commits and in the current content of `src/content/docs/`.
```

Leave `<date>` literal until merge; fill in during the post-merge cleanup commit on `feature/cyoda-go-init` (or in the merge commit itself).

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/reviews/2026-04-22-correctness/README.md
git commit -m "$(cat <<'EOF'
docs(reviews): add remediation-status section to correctness review index

Records that Fix-now and clarity items have been actioned in the
docs/correctness-fixes-2026-04-22 PR; Reframe and Delete
post-#80 items remain enumerated for the post-#80 reframe PR.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Push and open PR

- [ ] **Step 1: Push the fix branch**

```bash
cd /Users/paul/dev/cyoda-docs/.worktrees/pivot
git push -u origin docs/correctness-fixes-2026-04-22
```
Expected: branch pushed; tracking configured.

If push fails with SSH permission error, HTTPS + `gh` credential helper is configured on this worktree per the handoff's "Sandbox gotchas" section. If not, run:
```bash
git remote set-url origin https://github.com/Cyoda-platform/cyoda-docs.git
git config --local credential.helper '!gh auth git-credential'
```
Then retry the push.

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base feature/cyoda-go-init --title "docs: correctness fixes from the 2026-04-22 review" --body "$(cat <<'EOF'
## Summary
- Apply all 20 Fix-now findings and 36 clarity suggestions from the 2026-04-22 correctness review.
- Four site-wide sweeps fix the highest-leverage issues in one pass each: Trino upcoming banner (4 pages), `/api/models/...` → `/api/entity/...` endpoint paths (3 pages), phantom `cyoda serve` subcommand (4 occurrences), `CYODA_STORAGE` → `CYODA_STORAGE_BACKEND` env var (3 pages).
- Add `upcoming` stability mode to `VendoredBanner` for roadmap-feature pages.
- Reframe-post-#80 (5) and Delete-post-#80 (1) items are **not** included — those wait for cyoda-go #80 and land in the follow-up reframe PR (cyoda-docs #69).

## Review input
- Spec: `docs/superpowers/specs/2026-04-22-cyoda-docs-correctness-review-design.md`
- Plan: `docs/superpowers/plans/2026-04-22-cyoda-docs-correctness-fixes.md`
- Review artefacts: `docs/superpowers/reviews/2026-04-22-correctness/`

## Test plan
- [ ] `ASTRO_TELEMETRY_DISABLED=1 npm run build` succeeds.
- [ ] `npx playwright test tests/link-integrity.spec.ts` passes (all internal links resolve).
- [ ] `GA_MEASUREMENT_ID=dummy npm test` passes (GDPR + GA tests).
- [ ] Visual check: open `http://localhost:4321/` via `npm run dev` and verify the Trino "upcoming" banner renders on the four affected pages.
- [ ] Spot-check the fixed curl examples against a live `cyoda-go` — create an entity via the corrected `POST /api/entity/JSON/orders/1`, transition it, fetch by UUID.

## Base branch note
This PR targets `feature/cyoda-go-init`, not `main`. `main` is production and holds the current site; `feature/cyoda-go-init` is the long-running integration branch awaiting QA before eventually merging to `main`.
EOF
)"
```

- [ ] **Step 3: Capture the PR URL**

Record the URL the `gh pr create` output prints. Done.

---

## Self-review

Applied inline before finalization:

**1. Spec coverage.** Each of the 20 Fix-now findings is claimed by one of Tasks 2–11. The four site-wide sweeps (Tasks 2, 3, 4, 5) cover 14 Fix-nows collectively: 3 CYODA_STORAGE, 4 cyoda serve, 7 endpoint-path (F1–F4 × 2 pages + F2 × 1 page = actually 4+4+3 = 11 endpoint-path claims counted per-finding, but that's a sweep-count not a finding-count). Per-page residuals (Tasks 7, 8, 10, 11) cover workflows-and-processors F1/F2, configuration F1/F2, getting-started F3, and the endpoint-sweep residuals (list-endpoint fix in F4, UUID/business-key note). 36 clarity suggestions are allocated across Tasks 7–13. Reframe (5) and Delete (1) are documented as deferred. ✓

**2. Placeholder scan.** No "TBD" or "fill in details". One soft spot: Task 11 says "Default Option A" for the workflow-import approach — this is a stated default plus Option B as an alternative; the executor knows what to do. Acceptable.

**3. Type/name consistency.** Branch name `docs/correctness-fixes-2026-04-22` is consistent. Component prop `stability="upcoming"` is consistent between Task 5a (declaration) and Task 5b (usage). Endpoint paths match across Tasks 4, 8, 11 and the review's Ground-truth citations. Environment variable `CYODA_STORAGE_BACKEND` is consistent. ✓

**4. Scope fidelity.** The plan explicitly defers Reframe-post-#80 (5 items) and Delete-post-#80 (1 item) to the post-#80 reframe PR. This matches the spec's §"Remediation taxonomy" and the cross-cutting doc's strategy implication. ✓
