# Session handoff — 2026-04-21

Durable pick-up notes for the cyoda-docs restructure pivot work after
context compaction. Written for a future instance (or human) resuming
cold.

## Where we are

- **Working directory:** `/Users/paul/dev/cyoda-docs/.worktrees/pivot`
  (git worktree of the main cyoda-docs repo).
- **Branch:** `restructure-cyoda-go-pivot` (pushed to origin).
- **Long-running integration branch:** `feature/cyoda-go-init`
  (branched from `origin/main`, pushed to origin). **`main` is
  production — do not merge to it yet.**
- **Open PR:** #66, `restructure-cyoda-go-pivot` →
  `feature/cyoda-go-init`. Not `main`.
  https://github.com/Cyoda-platform/cyoda-docs/pull/66
- **Last commit on branch:** `a631809` (two-mode schema clarification).

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

### 1. File the drafted GitHub issues (ready to proceed)

9 issues in `2026-04-21-upstream-issues.md`, #5 dropped.
User token already has admin on both `Cyoda-platform/cyoda-go` and
`Cyoda-platform/cyoda-docs` — **no token swap needed**. User said
"You file them" — pending approval on which of the 9 to file.

Filing plan (documented at the end of the drafts file):
`gh issue create --repo <repo> --label <labels> --title <title>
--body-file <extracted body>`, then append the resulting URL under
each issue heading.

### 2. Awaiting-upstream inlining pass

Replace three `awaiting-upstream` banner stubs (`reference/cli.mdx`,
`reference/configuration.mdx`, `reference/helm.mdx`) with hand-curated
content scanned from the local cyoda-go repos.

**Local cyoda-go sources** (per user's auto-memory):

```
~/go-projects/cyoda-light/cyoda-go
~/go-projects/cyoda-light/cyoda-go-spi
~/go-projects/cyoda-light/cyoda-go-cassandra
```

(`cyoda-go-cassandra` is confidential — do not expose its design
in public cyoda-docs.)

Targets (per PA-D4 review finding):

- `reference/cli.mdx`: subcommand table with one-line purpose +
  common invocations.
- `reference/configuration.mdx`: top-20 env-var table (var, type,
  default, purpose) + `_FILE` secret example.
- `reference/helm.mdx`: commented `values.yaml` excerpt + 3-row
  "minimum-viable overrides" table.

Mark all three `stability="evolving"` on the `VendoredBanner`.
Leave draft-issue #9 open (or close it) depending on user
preference.

### 3. Ranked-fix-list quick wins (items 1–6 in the review doc)

1. Reconcile workflow JSON shape between
   `getting-started/install-and-first-entity.mdx` and
   `build/workflows-and-processors.mdx`.
2. Unify `pointTime` ↔ `point_time` spelling and add a worked
   example per surface. (**Partly done** via the Trino port —
   `reference/trino.mdx` now shows `point_time` in a `TIMESTAMP`
   clause. REST side still needs a worked example.)
3. Add a "local dev auth" note to getting-started (close the first
   401 a self-hoster will hit).
4. Name the licence and add a one-paragraph OSS-vs-Cloud feature
   matrix.
5. Rewrite dead anchors `/reference/api/#search` and
   `/reference/api/#temporal`. (Partly addressed by planned issue
   #10 — `build/searching-entities.md` — which also closes the
   `/reference/api/#search` side.)
6. Retune Cloud positioning to match reality ("hosted preview of
   the Cassandra tier, Beta; production Cassandra via Enterprise
   License, self-hosted").

### 4. Longer-running asks (not in scope of this branch)

See ranked-fix-list items 7–13 in the review doc. Most require
product decisions upstream.

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
