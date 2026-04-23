# Cross-cutting findings — 2026-04-22 correctness review

**Inputs:** `sections/*.md` summaries + skim of `pages/*.md`.
**Scope:** issues that span multiple pages, not per-page findings.
**cyoda-go ref:** `6442de4696854ee8aa3b6d2ea9345b9c96eb6aad`

The Wave 2 section subagents independently surfaced four patterns that span the site and one that concentrates in reference pages. Each of these is more cheaply fixed once as a sweep than per-page.

---

## 1. Scope contamination — Cloud-only features presented as OSS

The largest cross-cutting signal. Three section agents independently flagged the same category of mistake: content describing features that live in Cyoda Cloud / the confidential Cassandra tier has been written into OSS-path pages without a scope boundary. The ledger (§"Analytics / Trino") verified these features are absent from cyoda-go at the pinned commit.

**Pages affected:**
- `concepts/apis-and-surfaces.md` — "three distinct API surfaces" framing with ~18-line Trino section
- `build/analytics-with-sql.md` — entire page describes Trino/JDBC/SQL analytics as a Cyoda feature
- `reference/trino.mdx` — Trino surface spec with Cloud-specific JDBC hostnames (`*.eu.cyoda.net`)
- `build/testing-with-digital-twins.md` — "same API contracts (REST, gRPC, Trino)"
- `concepts/workflows-and-events.md` — time-based and message-based workflow triggers (no timer or message bus in OSS)
- `concepts/design-principles.mdx` — "clock tick" as event-trigger example (parallel error to above)

**Ground truth:**
- Trino: `grep -ril "trino" ~/go-projects/cyoda-light/cyoda-go` → zero matches.
- Workflow triggers: `internal/domain/workflow/engine.go` implements only manual + automatic-cascade paths; no timer scheduler, no message bus.

**Remediation bucket (site-wide):** Mixed. Heaviest items are **Delete post-#80** (analytics-with-sql, trino.mdx). Narrative Trino mentions in concepts/apis-and-surfaces and build/testing-with-digital-twins are **Fix now** (trim to "two surfaces" or add Cloud-only scope caveat). Time/message trigger claims are **Delete post-#80**.

**Root-cause hypothesis:** these pages appear to have been written against Cyoda Cloud's feature set and copied to the OSS-path docs without re-scoping. Recommend establishing a rule: any feature described in `src/content/docs/{concepts,build,run,reference}/**` without an explicit Cloud-only banner must be verifiable against OSS cyoda-go.

---

## 2. `/api/models/...` endpoint path drift

All three pages that give live REST examples use a non-existent path scheme (`/api/models/{entityName}/entities`). The canonical shape in `api/openapi.yaml` is `/api/entity/{format}/{entityName}/{modelVersion}` for entities and `/api/search/{direct|async}/{entityName}/{modelVersion}` for search.

**Pages affected:**
- `build/working-with-entities.md` — 4 Fix-now on this pattern
- `build/searching-entities.md` — 4 Fix-now on this pattern
- `getting-started/install-and-first-entity.mdx` — 3 instances of the same wrong path in the primary OSS onramp

**Ground truth:** `api/openapi.yaml:L1053, L1324, L2035, L2182, L5001, L5324`; no `/api/models/*/entities` path exists.

**Remediation bucket:** Fix now, site-wide. Plus a Coverage recommendation: **establish a single authoritative endpoint reference table** (Reference → API) that all example pages cite, so future examples don't drift.

---

## 3. Phantom `cyoda serve` subcommand

Four pages refer to `cyoda serve` as the command to start the server. There is no `serve` subcommand. `cmd/cyoda/main.go:L36-48` recognizes only `--help`/`-h`, `init`, `health`, `migrate`; everything else falls through to the server-start path. So `cyoda serve` "works" today (the `serve` argument is silently ignored), but it is not a recognized subcommand, is undocumented, and would break if a real `serve` subcommand were ever introduced.

**Pages affected:**
- `run/desktop.md:L45` — "To start the server: `cyoda serve`"
- `reference/cli.mdx:L21` — "serving (`cyoda serve`)"
- `getting-started/install-and-first-entity.mdx:L43, L56` — twice

**Ground truth:** `cmd/cyoda/main.go:L36-48`.

**Remediation bucket:** Fix now, site-wide. Single sweep replacing `cyoda serve` with `cyoda` (the bare binary invocation). Wave 3 recommends adding a small "Subcommands" table to `reference/cli.mdx` that lists the real subcommand set, which will preempt the same mistake from recurring.

---

## 4. `CYODA_STORAGE` vs `CYODA_STORAGE_BACKEND` env var

The storage backend environment variable is **silently** misdocumented on three pages. A user typing `export CYODA_STORAGE=postgres` sees no effect — the wrong name is ignored, and the app falls back to the hardcoded default (`memory`). This is a worse class of bug than a 404: the misconfiguration doesn't error, it just produces the wrong runtime shape.

**Pages affected:**
- `run/desktop.md:L57` — "(`CYODA_STORAGE`, listen ports, JWT keys)"
- `run/docker.md:L41` — "`CYODA_STORAGE=postgres`"
- `getting-started/install-and-first-entity.mdx:L126` — "`CYODA_STORAGE=memory`"

**Ground truth:** `app/config.go:L110` reads `CYODA_STORAGE_BACKEND` (default `memory`).

**Remediation bucket:** Fix now, site-wide. A `grep -rn 'CYODA_STORAGE[^_]' src/content/docs/` sweep followed by replacement. Consider adding to Playwright link-integrity test suite a content-lint pass that catches this class of known-bad env var name.

---

## 5. Terminology drift — limited, low-impact

Two terminology issues surfaced, both narrow:

- **`direct` vs `immediate`** for synchronous search mode (`build/working-with-entities.md` C1). API-side term is `direct`; the page uses "Immediate (API term: `direct`)" inconsistently. Pick one and use it throughout.
- **`processor`, `calculation node`, `calculation member`** — the site uses all three interchangeably in places. Not flagged as a Fix-now by any agent but worth harmonizing in a future pass. Post-#80, `cyoda help workflows processors` will own the canonical naming.

**Remediation bucket:** Fix now for `direct/immediate`; defer processor-synonym pass to post-#80 reframe PR.

---

## 6. Coverage gaps (cross-site, beyond per-page)

These are things multiple agents expected to find across the site but didn't:

- **No endpoint reference table anywhere.** Eight pages reference REST endpoints. Every example drifts independently. A single reference table (or, post-#80, a link into `cyoda help openapi`) would solve this class of drift permanently.
- **Processor idempotency / at-least-once contract.** Flagged in `build/workflows-and-processors.md` (clarity), `build/client-compute-nodes.md` (coverage), and partially in `concepts/workflows-and-events.md` (coverage). No page states explicitly that processors are retried on failure and must be idempotent. Add a one-paragraph note in `build/workflows-and-processors.md` as the canonical source; cross-reference from the others.
- **Default workflow (NONE → CREATED → DELETED) is invisible.** `getting-started/install-and-first-entity.mdx` and `concepts/workflows-and-events.md` both introduce custom workflows without explaining that a default workflow ships with cyoda-go and applies when no custom workflow is imported. Add a "Default workflow" note under `build/workflows-and-processors.mdx`.
- **Data directory location.** `run/desktop.md` uses XDG paths (`~/.local/share/cyoda/cyoda.db`), `run/docker.md` uses `/var/lib/cyoda`. Neither page mentions the other's location. Migrators need the cross-reference.
- **HMAC secret GitOps coupling.** `run/kubernetes.md` describes HA but doesn't mention that the Helm chart auto-generates the HMAC secret unless `existingSecret` is provided — load-bearing for GitOps workflows where Helm renders drift on every reconcile.
- **`cyoda-cloud/**` hand-off.** Several OSS-path pages mention Cloud-only features without pointing readers to the Cloud docs. Ensure the Cloud-only scope caveats include a concrete next-step link.

**Remediation bucket:** Mixed (Fix now for the missing notes, Reframe post-#80 for the endpoint table once help ships).

---

## 7. Clarity-suggestion synthesis — convergent nits worth a single pass

Clarity suggestions that two or more section agents independently proposed, suggesting a site-wide convention gap:

- **Decision-first page structure.** Concepts `apis-and-surfaces.md` C1 and build `workflows-and-processors.mdx` implicitly both want the "when to use X vs Y" decision up top, before the detail. Worth adopting as a house convention for surface/feature pages.
- **ISO 8601 / UTC explicit.** Both build `searching-entities.md` C1 and build `working-with-entities.md` cover notes expect readers to already know the `pointInTime` / `pointTime` format. Adopt a site-wide convention: first mention spells out "ISO 8601, UTC (e.g., `2026-03-01T00:00:00Z`)"; subsequent mentions abbreviate.
- **Worked examples alongside predicate grammar.** `build/searching-entities.md` C3 and `concepts/workflows-and-events.md` coverage note: several pages describe criteria/predicate grammar in prose without a minimal JSON specimen. Adopt: every predicate-grammar mention ships with at least one JSON example.

**Remediation bucket:** Fix now in the remediation PR that actions Fix-now findings; these are small edits that compose well with the systematic sweeps above.

---

## Summary table — bucket totals across the site

| Section | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|---------|---------|------------------|-----------------|---------|
| getting-started + root | 4 | 1 | 0 | 3 |
| concepts | 1 | 0 | 2 | 4 |
| build | 11 | 2 | 3 | 10 |
| run | 3 | 1 | 0 | 8 |
| reference | 4 | 1 | 1 | 7 |
| **Total** | **23** | **5** | **6** | **32** |

**Strategy implication:**
- The 23 Fix-now items land in a single remediation PR cut off `feature/cyoda-go-init`.
- The 5 Reframe + 6 Delete post-#80 items are the pre-enumerated worklist for the post-#80 reframe PR (see cyoda-docs #69).
- The 32 clarity suggestions fold into the Fix-now PR with a lighter review bar.
- The site-wide sweeps (sections 2–4 above) are the most efficient fix vector — one grep-and-replace addresses issues across many pages.
