# Session handoff — 2026-04-21

Durable pick-up notes for the cyoda-docs restructure pivot work after
context compaction. Written for a future instance (or human) resuming
cold.

## Where we are

- **Working directory:** `/Users/paul/dev/cyoda-docs/.worktrees/pivot`
  (git worktree of the main cyoda-docs repo).
- **Branch in the worktree:** `feature/cyoda-go-init` (as of 2026-04-22).
  `restructure-cyoda-go-pivot` no longer exists — PR #66 was
  rebase-merged into `feature/cyoda-go-init` and the branch deleted.
- **Long-running integration branch:** `feature/cyoda-go-init`
  (current tip `bc26a58`; `main` + the 77 pivot/content commits).
  **`main` is production — do not merge `feature/cyoda-go-init` to
  it yet; still awaiting Paul's independent QA pass.**
- **Main** is production, currently includes the full astro-6 upgrade
  wave (PR #70) and Node-22 CI bump (PR #71), all 6 dependabot bumps
  landed 2026-04-22.
- **Open PRs:** none for this work stream. All 9 original dependabot
  PRs resolved.
- **Future pivot-style work:** open new branches off
  `feature/cyoda-go-init`.

## Artefacts in this worktree

Read these first if resuming cold:

- `docs/superpowers/specs/2026-04-20-cyoda-docs-restructure-design.md`
  — the user-approved spec that drove the restructure.
- `docs/superpowers/plans/2026-04-20-cyoda-docs-restructure.md`
  — the plan derived from the spec (Phases 1–11). Phase 7–9 are
  landed on the branch; Phase 10/11 were superseded by the current
  PR and review workflow.
- `docs/superpowers/reviews/2026-04-21-three-persona-content-review.md`
  — consolidated output of three-persona independent review (senior
  backend engineer / platform architect / senior data engineer, 15
  parallel deep-dives), plus post-review update with audit findings,
  ports landed, and the DE-D3 mis-framing correction.
- `docs/superpowers/reviews/2026-04-21-upstream-issues.md`
  — drafts of 10 GitHub issues arising from the review and content
  audit. **Nothing filed yet.** #5 is dropped with rationale.
- `docs/superpowers/reviews/2026-04-21-session-handoff.md`
  — this file.

## What is done

Landed and pushed to PR #66:

- **IA restructure** (Phases 1–6 of the plan): new sidebar IA
  (Getting Started / Concepts / Build / Run / Reference), visual
  refresh, 29 hand-written content pages rewritten, auto-generated
  schema pages moved to `/reference/schemas/**`, discoverability
  features (markdown export with UTF-8 BOM, `llms.txt`,
  `schemas.zip`), Playwright link-integrity test.
- **Three-persona content review**, independent fresh-context
  sweeps + 15 targeted deep-dives. Consolidated report committed.
- **Dropped-content audit** surfaced two silently removed guides
  pages from the old IA; both ported on this branch:
  - `src/content/docs/reference/trino.mdx` — mostly-verbatim port of
    `guides/sql-and-trino.md`.
  - `src/content/docs/reference/entity-model-export.mdx` — mostly-
    verbatim port of `guides/entity-model-simple-view-specification.md`.
  - `src/content/docs/build/analytics-with-sql.md` — new concise
    Build-side intro matching the one-page-per-surface-role pattern
    (REST ↔ search, gRPC ↔ compute, Trino ↔ analytics).
- **Cross-link hygiene:** `concepts/apis-and-surfaces.md` retired
  its "will move into a dedicated Trino reference page" promise;
  `build/modeling-entities.md` cross-links the new
  entity-model-export; `astro.config.mjs` redirects retargeted.
- **Schema-evolution clarification:** `build/modeling-entities.md`
  and `concepts/entities-and-lifecycle.md` updated to make the
  two-mode contract (discover vs lock) explicit, including the
  FpML-style production example explaining why locked-and-reject is
  the right default for regulated systems. Addresses the mis-framing
  the DE-D3 review made.

## Open threads (pick up in this order)

### 1. File the drafted GitHub issues — DONE (one cleanup deferred)

**Status (2026-04-21, end of day):** All 8 live issues filed.

- Cyoda-go: #9→[#80](https://github.com/Cyoda-platform/cyoda-go/issues/80),
  #1→[#81](https://github.com/Cyoda-platform/cyoda-go/issues/81),
  #2→[#82](https://github.com/Cyoda-platform/cyoda-go/issues/82),
  #4→[#83](https://github.com/Cyoda-platform/cyoda-go/issues/83),
  #6→[#84](https://github.com/Cyoda-platform/cyoda-go/issues/84).
- Cyoda-docs: #8→[#67](https://github.com/Cyoda-platform/cyoda-docs/issues/67),
  #10→[#68](https://github.com/Cyoda-platform/cyoda-docs/issues/68),
  #11→[#69](https://github.com/Cyoda-platform/cyoda-docs/issues/69).

Draft doc `2026-04-21-upstream-issues.md` annotated with `**Filed:** <url>`
under each issue heading.

**Deferred cleanup — DONE.** All four patched bodies (cyoda-go #80, #81,
#82 and cyoda-docs #69) applied via `gh issue edit`. Cross-refs in
filed issues now point at the real filed issue numbers / full URLs.

### 1-legacy (historical) — original two-phase plan

**Status (2026-04-21, later in day):** 8 live issues in
`2026-04-21-upstream-issues.md`. #5 dropped, #3 and #7 **SUPERSEDED**
by the new #9 (topic-structured `cyoda help` surface consolidating
their content). New #11 added as the docs-side follow-up.

Bodies pre-extracted to `.sandbox/issue-bodies/` (sandbox, not
committed). Two-phase filing script in `.sandbox/`:

- **Phase A — cyoda-go** (`.sandbox/file-issues-phase-a.sh`): files
  #9, #1, #2, #4, #6. #9 goes first because others reference it.
  Requires a GH_TOKEN with issue-write permission on
  `Cyoda-platform/cyoda-go`.
- **Phase B — cyoda-docs** (`.sandbox/file-issues-phase-b.sh`): files
  #8, #10, #11. Requires a GH_TOKEN with issue-write permission on
  `Cyoda-platform/cyoda-docs`. Tokens are per-repo; user must token-
  swap between phases.

Both scripts record URLs to `.sandbox/filed-urls.txt` as they go.
**First attempted filing of #9 returned** `GraphQL: Resource not
accessible by personal access token (createIssue)` — the default
session token is read-only on cyoda-go. User exited to re-auth.

**After both phases run:**

1. Read `.sandbox/filed-urls.txt` and append each URL under its
   issue heading in `2026-04-21-upstream-issues.md` as
   `**Filed:** <url>`.
2. Cross-refs inside filed issue bodies use **draft** numbers
   (e.g. `#9` in #1's body means draft-#9, not a live GitHub
   reference). Post-filing, run a single pass of
   `gh issue edit --body-file` on each issue to replace draft-#N
   refs with the real URL/number, using `.sandbox/filed-urls.txt`
   as the map. This is only cosmetic — the draft file remains the
   authoritative cross-ref map.
3. Commit the URL-annotated draft file to the branch.

### 2. Awaiting-upstream inlining pass — obsoleted

**Status:** This thread was superseded by the new #9 / #11 structure.

Instead of hand-curating `reference/cli.mdx`,
`reference/configuration.mdx`, `reference/helm.mdx` from local
cyoda-go sources, the plan is now to reframe those pages as
navigators once the `cyoda help` surface ships (#9) and cyoda-docs
imports help markdown from a release asset (#11). Leave the
`awaiting-upstream` banners in place; retarget them at filed #9
after Phase A.

(Original plan preserved below for reference — do not execute.)

**Local cyoda-go sources** (per user's auto-memory):

```
~/go-projects/cyoda-light/cyoda-go
~/go-projects/cyoda-light/cyoda-go-spi
~/go-projects/cyoda-light/cyoda-go-cassandra
```

(`cyoda-go-cassandra` is confidential — do not expose its design
in public cyoda-docs.)

Former targets:

- `reference/cli.mdx`: subcommand table with one-line purpose +
  common invocations.
- `reference/configuration.mdx`: top-20 env-var table (var, type,
  default, purpose) + `_FILE` secret example.
- `reference/helm.mdx`: commented `values.yaml` excerpt + 3-row
  "minimum-viable overrides" table.

Mark all three `stability="evolving"` on the `VendoredBanner`.
Leave draft-issue #9 open (or close it) depending on user
preference.

### 3. Ranked-fix-list quick wins (items 1–6 in the review doc) — DONE

All six items landed on this branch:

1. **DONE** (commit `04c4e2b`) — Workflow JSON shape in
   `getting-started/install-and-first-entity.mdx` corrected to match
   the canonical shape used in `build/workflows-and-processors.mdx`,
   verified against cyoda-go `internal/e2e/entity_lifecycle_test.go`
   (map-keyed `states`, `initialState`, transitions use `next`, etc.).
2. **DONE** (commit `b59c5ab`) — REST temporal parameter unified to the
   actual spelling: `pointInTime` (camelCase with middle "In"), as seen
   in `cyoda-go/api/openapi.yaml` ~line 805. Trino column stays
   `point_time` (snake-case). `working-with-entities.md` and
   `searching-entities.md` both corrected; historical-reads section
   now explicitly calls out the surface split.
3. **DONE** (commit `8d86f5c`) — Local-dev auth note added to
   getting-started. Explains mock mode default
   (`CYODA_IAM_MODE=mock`, no token needed) and the JWT-mode flip.
   Grounded in `cyoda-go/cmd/cyoda/main.go` env-var help.
4. **DONE** (commit `da7120d`) — Run index now has a License and
   editions section: cyoda-go Apache 2.0 (OSS), Cyoda Cloud (Beta),
   Enterprise (self-hosted Cassandra, contact sales).
5. **DONE** — `/reference/api/#search` and `/reference/api/#temporal`
   dead anchors gone. `build/searching-entities.md` created (commit
   `1c9d9b7`) and `working-with-entities.md` relinked to it and to
   `analytics-with-sql` for the SQL form of historical reads.
6. **DONE** (commit `da7120d`, same as item 4) — Cloud positioning
   retuned in the Run index editions table. The existing
   `run/cyoda-cloud/index.mdx` already framed Cloud as Beta; the new
   table ties that to the edition split explicitly.

### 4. Longer-running asks (not in scope of this branch)

See ranked-fix-list items 7–13 in the review doc.

- **Items 7, 8, 9, 10** — live. Items 8/9/10 are docs-only and
  unblocked (Concepts dedup, terminology fix, compliance landing
  page). Item 7 is superseded by the navigator reframe once #80/#69
  land.
- **Items 11** — partially tracked as cyoda-go #84 (CDC semantics).
  Docs recipe waits on that.
- **Items 12 and 13 — DISMISSED as reviewer mis-framing.** Both
  dispositions recorded in the review doc's "Mis-framing correction"
  sections. #12 is schema evolution (stricter than Confluent, not
  weaker). #13 is ops homework for standard DB services and a
  stateless cyoda-go cluster — those belong to the operator and the
  backing-store vendor, not to Cyoda. No upstream issues, no docs
  work planned.

### 5. Eventual merge path

Once `feature/cyoda-go-init` is fully ready (all planned work
landed, reviewed, tested), open a second PR: `feature/cyoda-go-init`
→ `main`. Separate review cycle.

## Sandbox gotchas (will bite next session)

- **SSH is blocked.** `/Users/paul/.ssh/id_ed25519` is not readable
  from the Claude sandbox. Git push/fetch over SSH will fail with
  "Operation not permitted."
- **Workaround:** use HTTPS origin with `gh` as credential helper:
  ```bash
  git remote set-url origin https://github.com/Cyoda-platform/cyoda-docs.git
  git config --local credential.helper '!gh auth git-credential'
  git config --local credential.https://github.com.helper '!gh auth git-credential'
  ```
  Already configured on this worktree; if a fresh clone is made
  elsewhere it will need the same treatment.
- **Global `.gitconfig` is read-only** in the sandbox. Use
  `--local` for any git config changes.
- **Astro build needs telemetry disabled:** Astro tries to `mkdir
  ~/Library/Preferences/astro` which the sandbox blocks. Always run
  `ASTRO_TELEMETRY_DISABLED=1 npm run build:only` (or full
  `npm run build`).
- **macOS keychain credential-storage errors (`failed to store:
  -60008`)** from `git push` are harmless — the push itself
  succeeds.

## Verification commands

```bash
# Build (fast path, skips generators + export + zip)
ASTRO_TELEMETRY_DISABLED=1 npm run build:only

# Full build (runs schema-pages + markdown export + llms.txt + zip)
ASTRO_TELEMETRY_DISABLED=1 npm run build

# Link integrity — crawls dist/**/*.html for dead internal links
npx playwright test tests/link-integrity.spec.ts

# Full test suite
npm test
```

## Memory references

User's auto-memory (persists across sessions):

- `.sandbox` is local-only; never commit.
- `cyoda-go-cassandra` is confidential; don't expose its design in
  public cyoda-docs.
- Local cyoda-go paths: `~/go-projects/cyoda-light/{cyoda-go,
  cyoda-go-spi, cyoda-go-cassandra}`.

## User preferences observed this session

- Prefers concise, decision-ready responses over verbose ones.
- Wants drafts committed for review before user-visible cross-repo
  actions (filing issues, pushing, etc.).
- Production is `main`; work stages on long-running feature
  branches.
- Tracks upstream documentation tickets on cyoda-go issues with a
  `cyoda-docs` (or `documentation`) label, not on cyoda-docs
  directly, except for docs-internal follow-ups.
- When reviewer findings look significant, sanity-check the
  product model before filing an upstream ask — the EDBMS model
  breaks several common patterns.
