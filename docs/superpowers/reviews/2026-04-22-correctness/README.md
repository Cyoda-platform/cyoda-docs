# Cyoda-docs correctness & alignment review — 2026-04-22

**Spec:** [../../specs/2026-04-22-cyoda-docs-correctness-review-design.md](../../specs/2026-04-22-cyoda-docs-correctness-review-design.md)
**Plan:** [../../plans/2026-04-22-cyoda-docs-correctness-review.md](../../plans/2026-04-22-cyoda-docs-correctness-review.md)
**cyoda-go ref:** see [`CYODA_GO_SHA`](CYODA_GO_SHA) — `6442de4696854ee8aa3b6d2ea9345b9c96eb6aad`
**Scope:** OSS cyoda-go only. Cloud pages and the confidential Cassandra tier are out of scope.

## Status

| Wave | Artefact | Status |
|------|----------|--------|
| 1 | [`ledger.md`](ledger.md) | complete |
| 2 | `pages/*.md` + `sections/*.md` (29 per-page + 5 section summaries) | complete |
| 3 | [`cross-cutting.md`](cross-cutting.md) + this index | complete |

## Headline results

- **20 Fix now** — factually wrong narrative/conceptual content. Cut into a remediation PR off `feature/cyoda-go-init`.
- **5 Reframe post-#80** — content stays but needs a "From the binary" callout into `cyoda help <topic>` once help ships.
- **1 Delete post-#80** — the time/message-based trigger paragraph in `concepts/workflows-and-events.md` (disappears when help lands or is reframed as forthcoming if the feature is on the roadmap).
- **36 clarity suggestions** — fold into the Fix-now remediation PR on a lighter review bar. Includes the "upcoming / roadmap" banners for Trino-bearing pages.

Site-wide sweeps (see [`cross-cutting.md`](cross-cutting.md) §1–4) are the most efficient fix vector:

1. **Trino upcoming banner** — apply a single "on the roadmap, not yet callable" banner to the four Trino-bearing pages; correctness of the documented specifics will be reviewed once Trino ships.
2. **`/api/models/...` endpoint path drift** on three pages; canonical is `/api/entity/...` or `/api/search/...`.
3. **Phantom `cyoda serve`** on four pages; binary starts with bare `cyoda`.
4. **`CYODA_STORAGE` vs `CYODA_STORAGE_BACKEND`** on three pages; silent misconfiguration (wrong var ignored → falls back to in-memory).

## Per-page index

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|--------:|-----------------:|----------------:|--------:|
| [root index.mdx](pages/root__index.md) | 0 | 0 | 0 | 0 |
| [getting-started/install-and-first-entity](pages/getting-started__install-and-first-entity.md) | 4 | 1 | 0 | 3 |
| [concepts/what-is-cyoda](pages/concepts__what-is-cyoda.md) | 0 | 0 | 0 | 0 |
| [concepts/entities-and-lifecycle](pages/concepts__entities-and-lifecycle.md) | 0 | 0 | 0 | 0 |
| [concepts/workflows-and-events](pages/concepts__workflows-and-events.md) | 0 | 0 | 1 | 1 |
| [concepts/digital-twins-and-growth-path](pages/concepts__digital-twins-and-growth-path.md) | 0 | 0 | 0 | 0 |
| [concepts/apis-and-surfaces](pages/concepts__apis-and-surfaces.md) | 0 | 0 | 0 | 2 |
| [concepts/authentication-and-identity](pages/concepts__authentication-and-identity.md) | 0 | 0 | 0 | 1 |
| [concepts/design-principles](pages/concepts__design-principles.md) | 0 | 0 | 0 | 1 |
| [build/index](pages/build__index.md) | 0 | 0 | 0 | 0 |
| [build/modeling-entities](pages/build__modeling-entities.md) | 0 | 0 | 0 | 0 |
| [build/workflows-and-processors](pages/build__workflows-and-processors.md) | 2 | 0 | 0 | 2 |
| [build/working-with-entities](pages/build__working-with-entities.md) | 4 | 1 | 0 | 2 |
| [build/searching-entities](pages/build__searching-entities.md) | 4 | 1 | 0 | 3 |
| [build/analytics-with-sql](pages/build__analytics-with-sql.md) | 0 | 0 | 0 | 1 |
| [build/client-compute-nodes](pages/build__client-compute-nodes.md) | 0 | 0 | 0 | 2 |
| [build/testing-with-digital-twins](pages/build__testing-with-digital-twins.md) | 0 | 0 | 0 | 2 |
| [run/index](pages/run__index.md) | 0 | 0 | 0 | 0 |
| [run/desktop](pages/run__desktop.md) | 2 | 1 | 0 | 2 |
| [run/docker](pages/run__docker.md) | 1 | 0 | 0 | 3 |
| [run/kubernetes](pages/run__kubernetes.md) | 0 | 0 | 0 | 3 |
| [reference/index](pages/reference__index.md) | 0 | 0 | 0 | 0 |
| [reference/api](pages/reference__api.md) | 0 | 0 | 0 | 0 |
| [reference/cli](pages/reference__cli.md) | 1 | 0 | 0 | 1 |
| [reference/configuration](pages/reference__configuration.md) | 2 | 0 | 0 | 2 |
| [reference/helm](pages/reference__helm.md) | 0 | 1 | 0 | 0 |
| [reference/trino](pages/reference__trino.md) | 0 | 0 | 0 | 2 |
| [reference/entity-model-export](pages/reference__entity-model-export.md) | 0 | 0 | 0 | 3 |
| [reference/schemas](pages/reference__schemas.md) | 0 | 0 | 0 | 0 |
| **Total (29 pages)** | **20** | **5** | **1** | **36** |

## Section summaries

- [getting-started + root](sections/getting-started.md)
- [concepts](sections/concepts.md)
- [build](sections/build.md)
- [run](sections/run.md)
- [reference](sections/reference.md)

## Cross-cutting findings

See [`cross-cutting.md`](cross-cutting.md) — scope contamination, endpoint path drift, `cyoda serve` phantom, `CYODA_STORAGE_BACKEND` typo, terminology drift, coverage gaps, clarity-suggestion synthesis.

## Remediation status

As of the `docs/correctness-fixes-2026-04-22` PR (pending merge to `feature/cyoda-go-init`):

- **Fix-now findings actioned:** 20 / 20. Four site-wide sweeps (`CYODA_STORAGE_BACKEND` typo · `cyoda serve` phantom · `/api/models/...` endpoint drift · Trino "upcoming" banner) plus per-page residuals.
- **Clarity suggestions actioned:** 36 / 36. Plus a follow-on correction (transition endpoint is `PUT`, not `POST`) that was caught during the endpoint-sweep implementation.
- **Reframe post-#80:** 5 enumerated; deferred to the post-#80 reframe PR (cyoda-docs #69).
- **Delete post-#80:** 1 enumerated (`concepts/workflows-and-events.md` time/message trigger paragraphs); deferred.

Per-page review files under `pages/` are historical records of what the review found — they do **not** get updated to reflect applied fixes. The authoritative "is it fixed?" answer lives in the commits on the correctness-fixes branch and in the current content of `src/content/docs/`.

## Next steps

1. **Fix-now remediation PR** — cut a branch off `feature/cyoda-go-init`, action every **Fix now** finding (20) and every accepted clarity suggestion (36). Site-wide sweeps first (single grep-and-replace across pages), then per-page fixes for content that doesn't fit a sweep. Review, merge.
2. **Wait for cyoda-go #80 + Trino release** — when `help.tar.gz` / `help.json` release assets ship, run the post-#80 alignment test per spec §"Post-#80 alignment test" (ledger ↔ `help.json` diff; per-page Reframe/Delete dispatch). Independently, once Trino ships in OSS, drop the upcoming banners and re-review the Trino-bearing pages against the implemented surface.
3. **Post-#80 reframe PR** — cyoda-docs #69. Import `help.tar.gz` at build time, add "From the binary" callouts where they apply, drop `awaiting-upstream` banners, action the one Delete post-#80 item (concepts/workflows-and-events trigger-type paragraph).
