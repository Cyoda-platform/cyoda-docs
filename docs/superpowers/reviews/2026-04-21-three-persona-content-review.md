# Three-persona content review — cyoda-docs restructure pivot

**Date:** 2026-04-21
**Scope:** 29 hand-written content files under `src/content/docs/**` on branch
`restructure-cyoda-go-pivot` (auto-generated `reference/schemas/**` pages
excluded).
**Method:** Three independent fresh-context sweeps — one per reader persona —
each followed by five parallel targeted deep-dives (15 reports total). Every
report operated without the current conversation's history or rationale; each
reacted only to what the pages actually say.

**Personas:**
1. **Senior backend engineer** — Go/Java/Python, skeptical of jargon, new to
   Cyoda; would run the code examples.
2. **Platform architect** — regulated-enterprise (fintech), owns the "should we
   adopt X?" decision; cares about HA, DR, compliance, vendor risk.
3. **Senior data engineer** — owns a Kafka/Trino/dbt/lakehouse estate; cares
   about schemas, events, SQL surface, ecosystem integration.

The raw per-persona sweeps and the 15 deep-dive transcripts are not persisted
in the repo; they lived in subagent outputs during the review session. This
document is the consolidated synthesis and is the durable artefact.

---

## Headline

The conceptual layer is the strongest part of the docs and carries the pitch
well. Every persona left the Concepts section intrigued. **Every persona
bounced off what sits underneath it.** The build, run, and reference layers
repeatedly assert things the concept layer promised — temporal queries, "same
code every tier", Trino SQL, audit-as-storage, "Full data export", "enterprise
scale on Cyoda Cloud" — and then either don't specify them, contradict them
elsewhere, or point at an `awaiting-upstream` banner. The docs site currently
**sells a product that the reference layer does not yet describe.**

---

## Convergent findings (flagged by 2+ personas)

### 1. The temporal / history model is asserted, never operationalised
_Flagged by backend-dev D2 & D5, data-engineer D1 & D4._

- `pointTime=` (REST) and `point_time` (Trino column) appear once each, are
  never cross-referenced, and may or may not be the same feature.
- No range endpoint ("every change to X in `[T1,T2]`"), no transition-log
  pagination, no Trino `AS OF` syntax, no consistency model for as-of reads,
  no retention / cost story.
- "History is storage, not an add-on" is the product's core differentiator.
  Four of fifteen deep-dives independently found it collapses under close
  reading.

### 2. Reference section is a credibility drag
_Flagged by platform-architect D4, data-engineer D1, and several build-page
deep-dives citing broken inbound links._

- 494 words of prose across six top-level reference pages. Three are
  `awaiting-upstream` stubs whose banner generates a GitHub-issue-on-click
  rather than pointing at a tracked ticket — reads as "we haven't even opened
  the ticket."
- Dead anchors: `/reference/api/#search`, `/reference/api/#temporal`, and a
  promised `/reference/trino/` that doesn't exist, all linked from build
  pages.
- Trino is named as a first-class surface across concepts and cloud pages and
  has **zero** reference content.

### 3. The growth-path / OSS / Cloud story is not internally honest
_Flagged by backend-dev D4, platform-architect D3 & D5._

- "Same code, every tier" is true only up to PostgreSQL for a self-hoster.
  Cassandra is **Cloud-only**.
- The only commercially "Available" Cloud tier is Free (auto-reset).
  Developer and Pro tiers are marked "Draft" in the entitlements table. The
  only "Available" paid path is **Enterprise License, self-hosted** — which
  runs outside Cyoda Cloud.
- So "enterprise scale on Cyoda Cloud" (home page, growth-path page) has
  **no commercial path today**, while Cloud's own landing page says
  "test/demo only, use at your own risk, redeploy will reset your data."
- No licence named, no OSS-vs-Cloud feature matrix, no company name, no SLA
  on any page in scope.

### 4. Auth is broken for a self-hoster
_Flagged by backend-dev D3, platform-architect D2._

- Getting-started uses no `Authorization` header. Working-with-entities
  assumes `Bearer $TOKEN`. No page explains how `$TOKEN` materialises
  locally.
- `caas_org_id`, `legalEntityId`, Auth0 — Cloud-specific vocabulary — leaks
  into `build/client-compute-nodes.md` sections framed as universal.
- Concepts and Configuration reference both dispatch to GitHub. **No in-docs
  path from `brew install` to an authenticated curl.**

### 5. Terminology drift for the central concept
_Flagged by backend-dev D1; visible downstream in data-engineer D2's
discussion of what "event" means._

- One thing is called: processor / external processor / externalised
  processor / calculation node / calculation member / client compute node.
  Four of these appear on the same page in places.
- "Internal processor (shipped with the platform)" is claimed in Concepts
  but doesn't exist in the build page's JSON type enum. Either Concepts is
  wrong, or Build is incomplete.
- "Event" is used in two inbound-only senses and conflated (trigger vs gRPC
  envelope), with no "event log" surface at all.

### 6. Workflow JSON shape mismatch
_Flagged by backend-dev D2 alone, but a first-tutorial-will-fail issue._

- Getting-started: `{states: [...], initial: "...", transitions: [{from,
  to}]}`.
- Build reference: `{states: {...}, initialState: "...", transitions nested
  inside states with next}`.
- A reader following getting-started and then importing the JSON will fail
  schema validation on **four field names**.

---

## Persona-unique signal

### Backend dev
Deduplicate the Concepts section. Three to four restatements of the same
"entity → workflow → revision → audit" pitch across what-is-cyoda /
design-principles / entities-and-lifecycle / workflows-and-events. Recommended:
fold `design-principles.mdx` upward into `what-is-cyoda` (the TL;DR Aside is
effectively a second intro) and let `entities-and-lifecycle` carry the first
deep dive.

### Platform architect
Operational content is hollow exactly where adoption decisions happen. DR and
multi-region **absent entirely**. PostgreSQL drawn as a single box with no HA
story. Backup is a four-line paragraph. Zero encryption-at-rest / KMS / BYOK
language. Zero certifications (not even a "targeting X by Y" line). GDPR
Article 17 contradicts "nothing is overwritten" with no reconciliation.
Direct intra-page contradiction between "per-tenant Cassandra keyspace" and
"Cassandra shared across tenants" on `run/cyoda-cloud/index.mdx`.

### Data engineer
The analytical/streaming story is absent, not just thin. **Zero mentions** of
Kafka, Debezium, Iceberg, dbt, Airflow, Snowflake, BigQuery, Databricks,
Tableau, Looker, Power BI anywhere in the content tree. No CDC-out of any
kind — gRPC is a work-dispatch channel, not a replayable log. Schema
evolution uses informal "widen/lock" language with no forward/backward/full
compatibility classes, no operational meaning for "migrate", no definition of
when `modelVersion` increments.

---

## Ranked fix list

### Quick wins (hours to a day, high impact)

1. **Reconcile the workflow JSON shape** between
   `getting-started/install-and-first-entity.mdx` and
   `build/workflows-and-processors.mdx`. Either shape is fine; currently the
   tutorial actively lies.
2. **Unify `pointTime` ↔ `point_time`** spelling and add one worked example
   per surface.
3. **Add a "local dev auth" note** to getting-started. Is there a no-auth
   default? If not, show how to mint a token. Close the first 401 a
   self-hoster will hit.
4. **Name the licence** and add a one-paragraph OSS-vs-Cloud feature matrix
   on `concepts/what-is-cyoda.mdx` or `run/index.mdx`.
5. **Rewrite the dead anchors** (`/reference/api/#temporal`,
   `/reference/api/#search`) in the build pages to point at real targets or
   inline the grammar they assume exists.
6. **Retune Cloud positioning** to match reality: "hosted preview of the
   Cassandra tier, Beta; production Cassandra via Enterprise License,
   self-hosted." Update the two pages that claim "enterprise scale on Cyoda
   Cloud" today.

### Medium (days, higher leverage)

7. **Inline a hand-curated Reference pass.** Top-20 env-var table in
   `configuration.mdx`; a commented `values.yaml` excerpt in `helm.mdx`; a
   `trino.mdx` stub with catalog name, JDBC URL template, one
   table-projection example, `AS OF` equivalent.
8. **Deduplicate Concepts.** Merge design-principles into what-is-cyoda;
   promote entities-and-lifecycle; move digital-twins-and-growth-path out of
   Concepts into Run as a tier-selection page.
9. **Terminology fix.** Commit to "processor" and "client compute node" as
   the two canonical terms; define their synonyms (calculation member,
   calculation node) once; confirm or retract "internal processor".
10. **Compliance landing page.** Even a single page naming sub-processors
    (Hetzner, Cloudflare, Auth0), explicitly saying "no certifications today,
    targeting X", and addressing GDPR erasure vs immutable storage, would
    unblock the next conversation with a risk function.

### Large (needs product decisions before docs can land)

11. **CDC / event-out story.** Either ship an outbox-via-processor recipe
    with delivery semantics, or explicitly state "no first-class
    change-data-out surface today" with a roadmap line. Silence is the
    worst option for this persona.
12. **Schema-evolution compatibility classes.** Needs product spec
    (forward / backward / full), then doc.
13. **Operational production story.** DR, multi-region, Postgres HA,
    observability SLIs, sizing model. This is Run-level work spanning
    product and docs.

---

## Meta-observations

- **Convergent severity is the strongest signal.** The temporal model and
  the reference section each surfaced independently from all three personas.
  Those two are the highest-leverage fixes; a week of editing on them would
  visibly lift the site.
- **The `awaiting-upstream` pattern is working against us.** Architects read
  it as "they haven't even filed the ticket"; data engineers read it as "the
  surface isn't stable"; backend devs read it as "I'm going to have to grep
  the repo anyway." If the underlying artefact exists, inline a hand-curated
  summary now; the banner can live under it at `stability="evolving"`
  without destroying trust.
- **The Concepts layer is genuinely good** — so good that it raises
  expectations the rest of the docs don't meet. This is not an argument to
  weaken Concepts; it's an argument to close the gap below it.
- **Persona overlap is instructive.** Every persona found the Trino surface
  a stub, auth broken for self-hosters, and Cloud's positioning
  contradictory. That's not three opinions — it's one fact found three
  ways.

---

## Follow-ups (tracked separately)

- **Awaiting-upstream inlining pass.** Scan the local cyoda-go repository
  (`~/go-projects/cyoda-light/cyoda-go`, `cyoda-go-spi`,
  `cyoda-go-cassandra`) and replace the three stub reference pages
  (`cli.mdx`, `configuration.mdx`, `helm.mdx`) with hand-curated summaries
  drawn from the canonical upstream sources. File scope and sourcing rules
  to be defined in a follow-up plan. Internal tickets tracked in the
  `cyoda-go` issues with the `cyoda-docs` / `documentation` label.
- **Fix list items 1–6 (quick wins).** Candidate for a focused follow-up
  pass on the same long-running feature branch as this restructure.
- **Fix list items 7–10 (medium).** Sequence after the quick wins; item 7
  has the biggest architect-perception lift.
- **Fix list items 11–13 (large).** Defer until product decisions are made
  upstream.

---

## Post-review update — 2026-04-21

### Dropped-content audit

The data-engineer deep-dive (DE-D1) scored the Trino surface as **7/8
UNANSWERED**. That score reflected the pivot branch, but not the
substance of what existed on `main`. An audit of the old `guides/` tree
against the new IA found two cases of silently dropped content:

- **`guides/sql-and-trino.md`** (1014 lines) — projection rules, table
  naming, JDBC URL template, type mapping with polymorphic temporal
  resolution, complete worked example. Addressed ~5 of DE-D1's 8
  questions; was dropped entirely.
- **`guides/entity-model-simple-view-specification.md`** (561 lines) —
  full API specification for `GET /model/export/SIMPLE_VIEW/…`: response
  envelope, node descriptors, 23-value DataType enum, 6 worked
  examples, embedded JSON Schema, RFC 7807 error shapes. Dropped
  entirely.

The two IAM pages (`iam-jwt-keys-and-oidc.md`,
`iam-oidc-and-jwt-claims.md`) were confirmed cleanly ported into
`run/cyoda-cloud/identity-and-entitlements.md`; no action needed.

### Ports landed on this branch

- `src/content/docs/reference/trino.mdx` — mostly-verbatim port of
  `guides/sql-and-trino.md`; frontmatter reframed for `reference/`
  voice, cross-links retargeted to new IA, `awaiting-upstream` banner
  replaced with `evolving` stability tier, explicit "Gaps in this
  reference" section captures what still needs upstream input
  (dialect scope, push-down, isolation, performance envelope).
- `src/content/docs/build/analytics-with-sql.md` — new concise
  Build-side intro page. One-page shape: when to use the SQL surface,
  JDBC connection recipe, first query, performance notes, pointer to
  the reference.
- `src/content/docs/reference/entity-model-export.mdx` —
  mostly-verbatim port of
  `guides/entity-model-simple-view-specification.md`; frontmatter
  reframed, duplicate H1 removed (Starlight renders the title), light
  copy edits for reference voice.
- `src/content/docs/concepts/apis-and-surfaces.md` — retired the
  "will move into a dedicated Trino reference page once the surface
  stabilises" promise; now links the live
  [`/reference/trino/`](https://docs.cyoda.net/reference/trino/) and
  the Build-side
  [`/build/analytics-with-sql/`](https://docs.cyoda.net/build/analytics-with-sql/).
- `src/content/docs/build/modeling-entities.md` — added cross-link to
  the new entity-model-export reference.
- `astro.config.mjs` — redirects for `/guides/sql-and-trino/` and
  `/guides/entity-model-simple-view-specification/` retargeted from
  placeholder destinations to the new pages.

### Net effect on DE-D1 findings

Trino deep-dive scored 7/8 UNANSWERED before the port. After the port,
roughly 5/8 of those answers are now in the reference page
(catalogue/table naming, JDBC URL, nested-type projection with worked
example, type mapping with polymorphic handling, a minimum temporal
predicate example via `point_time` and `TIMESTAMP` literal). The
remaining 3/8 — dialect scope, push-down matrix, isolation/consistency
and performance envelope — are reframed as upstream issue #4 in
`2026-04-21-upstream-issues.md`.

### New follow-up tracked

- **`build/searching-entities.md`** — captured as issue #10 in
  `2026-04-21-upstream-issues.md`. Mirrors
  `build/analytics-with-sql.md` for the REST surface and closes the
  dead `/reference/api/#search` anchor flagged by the review.

### Mis-framing correction — schema evolution

The data-engineer deep-dive (DE-D3) was, on closer reading, wrong in
its framing. It pattern-matched on Confluent Schema Registry semantics
(forward/backward/full compatibility classes, reader/writer schemas,
registry-incremented versions) and concluded Cyoda's schema-evolution
story was "informal" for lacking them.

In fact, Cyoda's model is **stricter and more appropriate for EDBMS**
than Confluent's:

- `modelVersion` is **application-controlled**, not
  platform-incremented. The app bumps it when it wants a new
  structural contract.
- Two modes cover the spectrum: **discover** (loose, widens on new
  samples) and **lock** (strict, rejects any non-matching entity).
  Locked is the right default for production systems with external
  interface contracts — e.g. a trading system whose workflow is
  tailored to a specific FpML version would get **silent corruption**
  under Confluent's "backward-compatible" policy, which still accepts
  widened writers.
- Compatibility across versions is deliberately an **application
  concern**: only the workflow code knows whether an added field or
  widened type leaves its transition logic valid.
- Revisions are immutable and tagged with the model version active at
  write time; old revisions are never re-validated or re-cast.

Upstream issue #5 has been **dropped** (see
`2026-04-21-upstream-issues.md` for the full explanation). The
docs-clarity gap the review found is real, and is resolved on this
branch:

- `build/modeling-entities.md` — added "Two modes: discover or lock"
  section with an FpML production example; rewrote "Evolving a model"
  to make `modelVersion`'s app-controlled nature, revision immutability,
  and the deliberate absence of a Confluent-style taxonomy explicit.
- `concepts/entities-and-lifecycle.md` — added a short framing of the
  two modes in the Schema section, pointing at `modeling-entities.md`
  for depth.

Keeping this note for future reviewers: anyone arriving from a
Kafka/Avro/Confluent background is likely to pattern-match the same
wrong way.
