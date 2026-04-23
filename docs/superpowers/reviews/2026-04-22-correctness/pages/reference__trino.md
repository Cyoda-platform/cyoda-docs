---
page: src/content/docs/reference/trino.mdx
section: reference
reviewed_by: wave2-reference
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Trino SQL surface — correctness review

## Summary
The page presents Trino SQL as a Cyoda feature (virtual SQL tables, node decomposition, type mapping, JDBC connector). All substantive claims on this page are **ungrounded for OSS cyoda-go**: Trino is not implemented in the OSS codebase. Per the ledger, Trino is a Cassandra-tier surface (cyoda-go-cassandra, confidential), not OSS cyoda-go. The entire page describes a Cloud-only feature as if it were a general Cyoda feature. Critical scope error.

## Correctness findings

### F1 — Entire page ungrounded in OSS cyoda-go — **Delete post-#80**
**Doc says:** Presents the Trino SQL surface (virtual tables, projections, JDBC connection, `point_time` column, etc.) as a Cyoda feature.
**Ground truth:** Trino integration is absent from OSS cyoda-go. `grep -ril "trino" /Users/paul/go-projects/cyoda-light/cyoda-go` returns zero matches across `.go`, `.yaml`, `.md` files. No Trino connector code, JDBC catalog, or SQL `AS OF` equivalent exists in the OSS repository.
**Citation:** Ledger §"Analytics / Trino"; `grep -ril "trino"` verification.
**Remediation:** Decide one of:
- **Delete post-#80** — if Trino is strictly a Cloud feature and should not appear in the OSS-path docs at all. Remove this page entirely and replace outbound links with a Cloud-section pointer.
- **Fix now via heavy rewrite** — if the page should remain as a pointer-from-OSS to the Cloud Trino docs, rewrite with a clear scope banner and reduce the page to a one-paragraph "This feature is available in Cyoda Cloud only; see [Cyoda Cloud → Analytics]."

### F2 — JDBC hostnames and Cloud-specific infra in OSS docs — **Fix now**
**Doc says:** JDBC connection string format cites `caas_user_id` and `.eu.cyoda.net` hostnames (Cloud-specific infrastructure).
**Ground truth:** These identifiers belong to Cyoda Cloud's infrastructure and are meaningless for OSS users.
**Citation:** Ledger §"Analytics / Trino" (OSS has no Trino/JDBC surface).
**Remediation:** Either delete the section with JDBC examples or explicitly scope it as "Cyoda Cloud only" under an appropriate banner.

## Clarity suggestions

### C1 — No explicit Cloud/OSS scope boundary
The page's awaiting-upstream banner suggests future documentation but does not clarify whether this feature is OSS-bound or Cloud-only. A reader of the OSS docs cannot infer from the prose whether to expect Trino in their OSS deployment. Making the Cloud scope explicit up-front would prevent readers from wasting time looking for Trino in cyoda-go.

## Coverage notes
- **Ungrounded claim (entire page):** The SQL endpoints referenced (e.g. `/sql/schema`) are listed in the OpenAPI spec as "not fully implemented" and do not carry Trino semantics. JDBC connection examples use Cloud-specific infrastructure. The page in its current form does not belong in the OSS-path docs.
