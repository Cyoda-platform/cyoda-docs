---
page: src/content/docs/concepts/apis-and-surfaces.md
section: concepts
reviewed_by: wave2-concepts
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# APIs and surfaces — correctness review

## Summary
Major correctness issue. The page claims three API surfaces (REST, gRPC, Trino SQL), but Trino SQL is not implemented in cyoda-go OSS and is a Cassandra-tier (Cloud-only) feature. This is a structural problem: the summary and organization of the page are built on a claim that is ungrounded for OSS readers. The REST and gRPC descriptions are accurate, but the page misleads OSS users into believing they have three surfaces to choose from.

## Correctness findings

### F1 — Trino SQL surface claimed but not implemented in OSS — **Fix now**
**Doc says:** Summary at L3: "Cyoda exposes three distinct API surfaces." L18-21: "**Trino SQL** — the surface for analytics. Cross-entity queries, reporting, JDBC connections, BI tools. Queries run against a Trino catalogue that projects entities into virtual SQL tables." L56-73: "## Trino SQL: cross-entity analytics" with descriptions of "virtual SQL tables", "relational queries", "point_time column", "JDBC connection patterns", "Trino SQL reference", "Analytics with SQL".

**Ground truth:** The ledger explicitly documents: "**Status: not implemented in OSS cyoda-go.** Verified absent: `grep -ril "trino"` across `~/go-projects/cyoda-light/cyoda-go` (`.go`, `.yaml`, `.md`) returns zero matches; no `trino/` or `analytics/` directories exist in the OSS tree. No JDBC surface, no Trino catalog, no `AS OF` SQL equivalent ships in OSS as of the pinned SHA." Confirmed by grep: zero matches for "Trino", "trino", "JDBC", "analytics" in the entire OSS codebase.

**Citation:** Ledger §"Analytics / Trino"; confirmed by `grep -ril "trino" /Users/paul/go-projects/cyoda-light/cyoda-go/` returns zero results.

**Remediation:** For OSS documentation: revise the opening to state "two API surfaces" (REST and gRPC). Remove or heavily revise the entire Trino section (L56-73). Move all Trino content to Cyoda Cloud documentation. Optionally add a note at the end: "Analytical SQL queries via Trino JDBC are available in Cyoda Cloud. See [Cyoda Cloud → Analytics](/run/cyoda-cloud/analytics/)."

## Clarity suggestions

### C1 — Surface selection logic should be earlier
The page jumps into detailed descriptions of each surface before answering "when should I pick each one?" The "Which surface, when?" section (L75-80) contains the most actionable guidance and should appear before or alongside the detailed descriptions, not after. A first-time reader might read the full Trino section before learning that Trino is for analytics and REST is the default.

## Coverage notes

- **Expected but missing:** The page does not explain that REST is the default surface for most Cyoda applications. A statement like "REST is the default surface for client applications" would set expectations clearly.
- **Ungrounded claim:** The entire Trino SQL section (L56-73, ~18 lines) is ungrounded in OSS. It describes virtual SQL tables, JDBC connection patterns, and Trino catalogs that do not exist in cyoda-go at the pinned commit. This is a structural issue that requires removal for OSS documentation.
