# Cross-cutting findings — 2026-04-22 correctness review

**Inputs:** `sections/*.md` summaries + skim of `pages/*.md`.
**Scope:** issues that span multiple pages, not per-page findings.
**cyoda-go ref:** `6442de4696854ee8aa3b6d2ea9345b9c96eb6aad`

The Wave 2 section subagents independently surfaced four patterns that span the site and one that concentrates in reference pages. Each of these is more cheaply fixed once as a sweep than per-page.

---

## 1. Trino content is for an upcoming (roadmap) feature — add an "upcoming" banner

Trino is on the roadmap and is expected to become available shortly. At the pinned cyoda-go commit, `grep -ril "trino" ~/go-projects/cyoda-light/cyoda-go` returns zero matches, so the documented specifics (JDBC URL pattern, catalog layout, `AS OF` spelling, projection rules) cannot be verified today. Correctness of those specifics is **out of scope for this review** and will be re-checked once Trino ships. The actionable signal today is **clarity**: readers must know the feature is forthcoming and not callable at this release.

**Pages affected:**
- `concepts/apis-and-surfaces.md` — "three distinct API surfaces" framing with ~18-line Trino section
- `build/analytics-with-sql.md` — full page describes Trino/JDBC/SQL analytics
- `reference/trino.mdx` — Trino surface spec with JDBC hostnames and type-mapping detail
- `build/testing-with-digital-twins.md` — inline "same API contracts (REST, gRPC, Trino)"

**Remediation bucket (site-wide): Clarity — add an "upcoming / roadmap" banner.** One banner template, applied consistently at the top of each Trino-bearing page or section:

> *Trino SQL is on the roadmap and not yet available in cyoda-go at this release. This content documents the planned surface; names and shapes may change before release.*

Drop the banner when Trino ships and re-review the specifics against the implementation. The ledger's Analytics/Trino section has been revised to note the roadmap status.

## 1b. Workflow-trigger copy that doesn't match the engine

Separate from Trino: `concepts/workflows-and-events.md` and `concepts/design-principles.mdx` describe time-based (scheduler) and message-based (ingest event / bus) workflow triggers. These are not implemented in the current workflow engine — `internal/domain/workflow/engine.go` runs only manual + automatic-cascade paths; no timer, no message bus. Unlike Trino, there is no known roadmap signal here, so the finding stands.

**Pages affected:**
- `concepts/workflows-and-events.md` — time-based and message-based trigger descriptions
- `concepts/design-principles.mdx` — "clock tick" as event-trigger example

**Remediation bucket:** **Delete post-#80** for the explicit trigger types in workflows-and-events (or reframe as forthcoming if the roadmap actually includes them — confirm with product before deletion). The design-principles "clock tick" example is a clarity-level tweak (replace with an implemented-today example).

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
| concepts | 0 | 0 | 1 | 5 |
| build | 10 | 2 | 0 | 12 |
| run | 3 | 1 | 0 | 8 |
| reference | 3 | 1 | 0 | 8 |
| **Total** | **20** | **5** | **1** | **36** |

**Strategy implication:**
- The 20 Fix-now items land in a single remediation PR cut off `feature/cyoda-go-init`. The four site-wide sweeps (§2–4 above, plus the Trino-banner sweep from §1) are the most efficient fix vector — one grep-and-replace per sweep addresses issues across many pages.
- The 5 Reframe + 1 Delete post-#80 items are the pre-enumerated worklist for the post-#80 reframe PR (see cyoda-docs #69).
- The 36 clarity suggestions fold into the Fix-now PR with a lighter review bar.
- Trino correctness will be re-reviewed once the feature ships; the "upcoming" banners let the existing content stay in place without misleading readers in the interim.
