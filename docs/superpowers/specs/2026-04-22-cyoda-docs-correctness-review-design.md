# Cyoda-docs correctness and alignment review — design

**Date:** 2026-04-22
**Branch:** `feature/cyoda-go-init` (`.worktrees/pivot`)
**Status:** Spec — awaiting user review before implementation plan.

## Context

The cyoda-docs restructure (PR #66, 2026-04-20) shipped a new IA and 29
rewritten pages, followed by a three-persona content review and the
ranked-fix-list items 1–6 landing on the branch. Two mis-framings from
that review (schema evolution; operational production story) are
recorded as dismissed.

Separately, upstream cyoda-go issue #80 proposes a topic-structured
`cyoda help` surface as the canonical reference for every flag, env
var, endpoint, metric, error code, and operation shape, with
`help.tar.gz` / `help.json` release assets. The companion cyoda-docs
issue #69 describes how the website becomes the narrative/visual skin
over that surface once it ships.

#80 is not delivered yet. This review's job is to get cyoda-docs into
a state where, when #80 ships, the alignment work is a mechanical
dispatch rather than a fresh site-wide read.

## Goal

Produce, for every in-scope cyoda-docs page, a review file that
captures:

1. **Correctness findings** against the current cyoda-go OSS codebase,
   each citation-grounded and bucketed as Fix now / Reframe post-#80 /
   Delete post-#80.
2. **Clarity suggestions** — narrative/presentation improvements the
   reviewer noticed while building a deep mental model of the topic.
3. **Coverage notes** — expected-but-missing, present-but-thin, or
   ungrounded claims.

Produce in addition a ground-truth **ledger** of cyoda-go facts
(compact, citation-first) and a **cross-cutting** synthesis doc
(terminology drift, duplication, contradictions, coverage gaps).

## Assumptions

- cyoda-go #80 will ship substantially as proposed: 13 top-level
  topics, per-topic `man`-page-like structure, `text` / `markdown` /
  `json` formats, `help.tar.gz` / `help.json` release assets. Exact
  topic-tree spelling may drift; the review's three-bucket taxonomy is
  resilient to that.
- OSS cyoda-go at `~/go-projects/cyoda-light/cyoda-go` is the sole
  reference. `cyoda-go-cassandra` is confidential and out of bounds.
  `cyoda-go-spi` is available if needed for interface-level
  clarification.
- This review does **not** implement the #80 reframe. It produces the
  pre-enumerated worklist that the reframe PR will dispatch against
  once #80 ships.

## Scope

### In scope

Hand-written pages under `src/content/docs/`:

- `getting-started/` — `install-and-first-entity.mdx`
- `concepts/` — all 7 pages
- `build/` — all 7 pages (including `index.mdx`)
- `run/` — `index.mdx`, `desktop.md`, `docker.md`, `kubernetes.md`
- `reference/` — `index.mdx`, `api.mdx`, `cli.mdx`, `configuration.mdx`,
  `helm.mdx`, `trino.mdx`, `entity-model-export.mdx`, `schemas.mdx`
- `src/content/docs/index.mdx` — site landing, reviewed only for claims
  that can be factually wrong.

Approximately 24 pages.

### Out of scope

- `run/cyoda-cloud/**` — all Cloud-specific pages.
- `src/content/docs/reference/schemas/**` — auto-generated from
  `src/schemas/**/*.json`; reviewed indirectly only if a JSON source
  contradicts cyoda-go (not planned in this review).
- Any content that would require reading `cyoda-go-cassandra`.

## Non-goals

- No docs edits during the review. Output is review artefacts only.
- No `cyoda help` callouts added to pages now; that's the post-#80
  reframe PR.
- No severity ratings. The three-bucket taxonomy plus clarity
  suggestions carry prioritization implicitly.
- No re-derivation of the 2026-04-21 three-persona review findings.
  Prior review is ignored entirely; fresh sweep against current branch
  state and current cyoda-go.

## Architecture — three waves

### Wave 1 — ground-truth ledger (1 subagent)

One subagent reads cyoda-go in depth and produces
`docs/superpowers/reviews/2026-04-22-correctness/ledger.md` — a
compact, citation-first record of what cyoda-go actually is today,
organized by the surface area cyoda-docs claims to describe.

Ledger surfaces:

- **CLI** — every `cyoda` subcommand, SYNOPSIS, flags (name, type,
  default), env-var companions. Cited to `cmd/cyoda/*.go`.
- **Configuration** — env var names, types, defaults, precedence rules
  (flag > env > file > default), `_FILE` secret pattern.
- **REST surface** — endpoint paths, verbs, request/response shapes,
  auth, pagination, temporal parameter spelling. Cited to
  `api/openapi.yaml` **and** handler files (handler confirms the OAS).
- **gRPC surface** — services, RPCs, CloudEvents envelope shape,
  compute-node protocol. Cited to `proto/cyoda/**` and the
  compute-node implementation.
- **Workflow JSON shape** — canonical map-keyed structure (`states`,
  `initialState`, transitions with `next`, processors, criteria).
  Cited to `internal/**` and `examples/**`; tests pin the contract.
- **Entity model** — `modelVersion` semantics, discover vs lock modes,
  revision immutability, `SIMPLE_VIEW` export shape.
- **Search** — query modes (direct/async), predicate grammar,
  pagination, `pointInTime` (REST) vs `point_time` (Trino).
- **Analytics / Trino** — catalog layout, JDBC URL template, `AS OF`
  equivalent.
- **Error model** — RFC 7807 Problem Details shape, gRPC status
  mapping, canonical error codes where enumerated in code.
- **Deployment** — Docker patterns, Helm chart values
  (`deploy/helm/`), desktop shape.
- **Auth** — `CYODA_IAM_MODE` values, defaults, JWT flip, local-dev
  no-auth default.
- **Telemetry** — metrics (name, type, labels), health/readiness
  endpoints, tracing headers, log schema, as far as they exist today.

#### Wave 1 depth requirements

- **Read the implementation, not just signatures.** Trace every
  behavior end-to-end: handler → service → plugin/storage → response.
  Don't stop at `openapi.yaml`; follow the handler to confirm it
  matches. Don't stop at a flag declaration; follow it to where it
  changes behavior.
- **No "looks like" grounding.** Every ledger entry cites a
  `file:line` the reviewer has actually read. "Probably X based on
  type name" is not admissible.
- **Capture non-obvious specificities.** Precedence subtleties,
  retry/idempotency contracts, side effects on workflow state,
  atomicity of transitions, error-path behaviors, default flip
  conditions (mock ↔ JWT), timeout/cancellation semantics,
  revision-immutability contracts.
- **Read tests.** `internal/e2e/`, `test/recon/`, handler-level
  tests pin contracts the docs should match. Tests are often the
  fastest path to intended behavior.
- **"Not implemented" is a valid entry.** If docs claim a surface
  cyoda-go doesn't expose, the ledger says so.
- **OSS only.** Cassandra-tier deltas are noted as out-of-scope;
  nothing from `cyoda-go-cassandra` leaks.

Ledger is terse and bounded — target ~800–1500 lines. It is its own
deliverable and is the input to the post-#80 alignment test.

### Wave 2 — per-section verification (5 subagents in parallel)

One subagent per sidebar section. Each gets the same template brief
parameterized by section. Inputs: section's page list, full
`ledger.md`, read access to `cyoda-docs` and `cyoda-go`.

Sections:

- `getting-started/` (1 page)
- `concepts/` (7 pages)
- `build/` (7 pages)
- `run/` (4 pages, OSS only — `index.mdx`, `desktop.md`, `docker.md`,
  `kubernetes.md`)
- `reference/` (~8 pages)

`src/content/docs/index.mdx` is reviewed by whichever agent has the
lightest section (getting-started) or is handled by main thread during
consolidation — spec defers this to the plan.

#### Per-page process

1. Read the page once end-to-end, no cross-referencing yet.
2. Enumerate concrete claims: flag names, env vars, endpoint paths,
   field names, JSON/YAML shapes, CLI invocations, type signatures,
   behavior statements.
3. Verify each concrete claim against the ledger; where the ledger is
   silent, read cyoda-go directly and cite `file:line`.
4. Sanity-read the narrative prose and conceptual framing — targeted,
   not line-by-line tracing of every sentence.
5. Produce the per-page review file per the schema below.

#### Wave 2 depth requirements

The reviewer's own understanding of cyoda-go for the section's topics
must be deep. The enumeration of findings stays targeted so the output
doesn't drown in nits. Deep understanding → sharp, confident findings;
shallow reading → noise.

- **Build a deep mental model first, then review.** Before opening the
  section's pages, the agent reads the cyoda-go sources relevant to
  the section's topics. For `build/`: workflow runtime, processor
  contract, search execution, model validation. For `reference/`:
  CLI, config, helm chart, OpenAPI, proto. Read, understand, then
  open the docs.
- **No assumptions from API shape.** A REST endpoint that looks like
  a PATCH may not behave like one. A flag named `--strict` may not
  mean what a reader would guess. Verify every behavior claim against
  code, not against what the name implies.
- **No pattern-matching from other systems.** Cyoda is an EDBMS; it
  is not Kafka, not Confluent Schema Registry, not CRUD-over-REST,
  not Postgres-with-extras. If a framing in the doc resembles one of
  those, check whether the resemblance is real or superficial.
- **When in doubt, read the test.** Test files usually answer
  contract questions cleanly.
- **Time-cost is fine.** Take the time to understand. A correct
  section review is worth more than a fast one. Targeted enumeration
  applies to what gets written down, not to how thoroughly the topic
  is understood.

#### Explicit gates

- No `cyoda-go-cassandra` reading, no Cloud-specific claims.
- Don't re-derive prior-review findings; don't flag a claim just
  because it used to be wrong.
- Don't propose the #80 reframe itself as a remediation — bucket
  findings only.
- Cap clarity suggestions at ~5 per page; if more, collapse into a
  single **Structural recommendation**.
- Do not edit any cyoda-docs file.

Each agent also writes `sections/<section>.md` — a short summary:
posture, per-bucket counts, list of cross-section issues the agent
noticed.

### Wave 3 — consolidation (main thread, serial)

Main thread reads all five `sections/<section>.md` summaries, skims
the per-page files, and produces:

- **`README.md`** — index: table of all pages with status, per-bucket
  counts, clarity-suggestion count, link to each per-page file.
  Pointer to ledger and cross-cutting doc.
- **`cross-cutting.md`** — five sections:
  1. **Terminology drift** — terms used inconsistently across
     sections, with the canonical form picked.
  2. **Duplicated reference content** — same flag/env var/endpoint
     described in more than one place; candidates for post-#80
     collapse.
  3. **Contradictions** — two pages making incompatible claims.
  4. **Coverage gaps** — surfaces cyoda-go exposes that the docs
     don't mention, and doc claims the ledger couldn't ground
     (grouped to avoid redundancy with per-page findings).
  5. **Clarity-suggestion synthesis** — if two or more section agents
     independently suggested the same clarity improvement, that's a
     site-wide convention gap, not N per-page suggestions.

Consolidation is bounded: one read-through, no new cyoda-go
exploration. Anything not in the ledger is a coverage gap, logged
once in cross-cutting, not chased.

## Per-page review file schema

Every file under `pages/<section>__<slug>.md` follows this template.

```markdown
---
page: src/content/docs/<path>
section: concepts|build|run|reference|getting-started
reviewed_by: <agent-id>
reviewed_on: 2026-04-22
cyoda_go_ref: <commit-sha-of-cyoda-go-at-review-time>
status: reviewed
---

# <Page title> — correctness review

## Summary
One paragraph: overall correctness posture (clean / minor / major /
structural rewrite), one-line characterization of the clarity
situation, one-line coverage verdict.

## Correctness findings

### F1 — <short claim> — **Fix now** | **Reframe post-#80** | **Delete post-#80**
**Doc says:** <verbatim or near-verbatim quote, with heading or line ref>
**Ground truth:** <what cyoda-go actually does>
**Citation:** `<cyoda-go path>:<line>` or `file:L<start>-L<end>`
**Remediation:** <1–3 sentences; for Reframe/Delete, what exactly moves to help>

### F2 — …

(no finding = "None." under the heading)

## Clarity suggestions

### C1 — <short label>
<1–3 sentences: what to improve and why it helps a first-time reader>

(cap ~5; if exceeded, collapse into one **Structural recommendation**
block instead)

## Coverage notes

- **Expected but missing:** <surface/concept the reviewer expected, not in the page>
- **Present but thin:** <claim is there but too shallow>
- **Ungrounded claim:** <doc says X; ledger silent; cyoda-go check inconclusive>

(no coverage notes = "None.")
```

Uniform enough that a small Bash/awk script can pull per-page bucket
counts into the index; loose enough that the reviewer writes
fluently.

## Remediation taxonomy — three buckets

Every correctness finding lands in exactly one bucket:

- **Fix now** — narrative or conceptual content that is factually
  wrong and would not move to help anyway. Gets fixed on this branch
  in a follow-up remediation PR (cut from this review's output).
- **Reframe post-#80** — content that stays but needs its
  reference-ish parts replaced with a pointer/callout into
  `cyoda help <topic>` once help ships. No action now; enumerated for
  the post-#80 reframe PR.
- **Delete post-#80** — pure reference duplication that disappears
  when help lands. No action now; enumerated for the same post-#80
  PR.

Clarity suggestions have no bucket — they are all "Fix now" in spirit
and are actioned in the Fix-now remediation PR that follows this
review.

## Clarity-suggestion calibration

A clarity suggestion qualifies only if at least one holds:

- A first-time reader would form a materially wrong mental model from
  the current text.
- The doc contradicts itself or uses two names for the same thing
  without reconciling them.
- The ordering buries a decision a reader must make before the later
  content is useful.
- A worked example is missing where the surrounding prose assumes one.
- The page makes a strong claim without saying what it's grounded in.

Explicitly not qualifying: tone/voice rewrites, synonym preferences,
heading-level cosmetics, sentence polish, adding caveats for
caveats' sake, adding diagrams for their own sake.

## Artefact layout

All under `docs/superpowers/reviews/2026-04-22-correctness/`:

```
docs/superpowers/reviews/2026-04-22-correctness/
  README.md              — index and entry point
  ledger.md              — Wave 1 output
  cross-cutting.md       — Wave 3 output
  pages/
    getting-started__install-and-first-entity.md
    concepts__what-is-cyoda.md
    concepts__entities-and-lifecycle.md
    …one file per in-scope page…
  sections/
    getting-started.md
    concepts.md
    build.md
    run.md
    reference.md
```

Committed incrementally. Nothing in `dist/`. Nothing in `.sandbox/`.

## Post-#80 alignment test

When cyoda-go ships #80 with `help.tar.gz` / `help.json`, two
mechanical checks consume this review's artefacts.

### Check 1 — ledger ↔ `help.json` diff

For each ledger surface, compare cited facts against the
corresponding `help <topic> --format json` descriptor:

- **Green** — ledger fact present in help with matching
  spelling/shape/default.
- **Amber** — ledger fact present but diverges (name, shape, default).
  Either the ledger was wrong, cyoda-go drifted, or #80's authors
  chose a different spelling — triage per case.
- **Red** — ledger fact absent from help. Either #80 missed a topic,
  or the ledger recorded something that was never meant to be stable.

Output: `alignment-post-80.md` with three-color breakdown per surface.

### Check 2 — per-page Reframe/Delete dispatch

The index already lists every finding bucketed Reframe or Delete. For
each:

- **Delete** — verify the content is now covered by a specific help
  topic. If yes, delete the section; if no, escalate (help missed a
  topic, or our Delete call was wrong).
- **Reframe** — replace the reference-ish content with a "From the
  binary" callout pointing at the specific help topic. This is the
  cyoda-docs #69 work; the review gives it a pre-enumerated worklist
  instead of a fresh site-wide scan.

## Success criteria

- Ledger exists, cites `file:line` for every entry, covers all 12
  surfaces above.
- Every in-scope page has a review file under `pages/` following the
  schema. No page is marked `status: reviewed` without a cyoda-go
  citation backing each correctness finding.
- `cross-cutting.md` lists terminology drift, duplication,
  contradictions, coverage gaps, and clarity-suggestion synthesis.
- `README.md` index renders a per-page bucket-count table.
- Post-#80 checks 1 and 2 are mechanically executable against the
  artefacts produced — verified by a human sanity-read of the index
  and ledger.

## Constraints and safety

- OSS cyoda-go only; `cyoda-go-cassandra` is confidential and not
  read.
- No docs edits during the review. Remediation PRs cut from the
  review output are separate.
- No `.sandbox/` content staged or committed.
- Work proceeds on `feature/cyoda-go-init` in
  `.worktrees/pivot`. Artefacts are committed to that branch.

## Open questions (for the plan phase)

- Exact allocation of `src/content/docs/index.mdx` — lightest section
  agent vs main-thread consolidation. Decide in the plan.
- Whether to freeze the cyoda-go commit SHA at ledger-extraction time
  for all section agents, so every finding is anchored to the same
  cyoda-go state. Recommended yes; confirm in the plan.
- Whether the Fix-now remediation PR is cut on this branch or on a
  new branch off `feature/cyoda-go-init`. Recommended: new branch,
  one PR. Confirm in the plan.
