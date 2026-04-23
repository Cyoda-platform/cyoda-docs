---
page: src/content/docs/build/analytics-with-sql.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Analytics with SQL — correctness review

## Summary
Correctness posture: structural rewrite required. The entire page is ungrounded for OSS cyoda-go scope. The ledger explicitly confirms Trino/SQL is NOT IMPLEMENTED in OSS: `grep -ril "trino"` across cyoda-go returns zero matches; no Trino connector, JDBC surface, or `AS OF` SQL equivalent ships in the OSS tree. The page claims a working Trino/SQL analytics surface as a feature of "Cyoda projects" without any caveat that this is Cloud-only. Verdict: rewrite as Cloud-only or delete entirely from the OSS docs.

## Correctness findings

### F1 — Entire page claims Trino SQL as a core OSS feature — **Delete post-#80**
**Doc says:** "Cyoda projects every entity model into a set of virtual SQL tables and exposes them through a Trino connector." Section "When to use SQL" onward describes JDBC connection strings, Trino table naming, point_time column support, etc., all as if they are available in cyoda-go.
**Ground truth:** Ledger §"Analytics / Trino": "Verified absent: `grep -ril "trino"` across `~/go-projects/cyoda-light/cyoda-go` (`.go`, `.yaml`, `.md`) returns zero matches; no `trino/` or `analytics/` directories exist in the OSS tree. No JDBC surface, no Trino catalog, no `AS OF` SQL equivalent ships in OSS as of the pinned SHA." Implication: "Any cyoda-docs page claiming a Trino JDBC URL, Trino catalog layout, or SQL `AS OF` equivalent as a feature of cyoda-go OSS is ungrounded. Trino integration is a Cassandra-tier surface (cyoda-go-cassandra, confidential) and therefore belongs to Cyoda Cloud documentation, not OSS-path cyoda-docs pages."
**Citation:** Ledger §"Analytics / Trino"; verification: no files matching "trino|Trino|TRINO" exist in cyoda-go main tree. The `SQL` endpoint references in the OpenAPI spec list "GET /sql/schema" and "POST /sql/schema/genTables/{entityModelId}" but these are noted as "not fully implemented" and do not include Trino connectivity.
**Remediation:** Delete this page entirely from the build section of OSS docs. If a placeholder is needed, replace with a one-paragraph note: "SQL analytics via Trino is a feature of Cyoda Cloud and licensed Enterprise deployments. It is not available in the open-source cyoda-go tier. For on-cluster analytics in OSS, use the search endpoints with aggregation logic in your application layer."

### F2 — JDBC connection string claims — **Delete post-#80**
**Doc says:** "The JDBC connection string pattern: `jdbc:trino://trino-client-<caas_user_id>.eu.cyoda.net:443/cyoda/<your_schema>`"
**Ground truth:** No JDBC support exists in OSS cyoda-go. This is a Cloud-specific claim masquerading as a general Cyoda feature.
**Citation:** Ledger §"Analytics / Trino"
**Remediation:** Delete. If retaining a Cloud-only page, move this to a Cyoda Cloud documentation set with explicit scope caveat.

### F3 — Table projection rules and Trino SQL reference — **Delete post-#80**
**Doc says:** References to "Trino SQL reference" (/reference/trino/) for "full projection rules, type mapping, polymorphic fields, complete worked example."
**Ground truth:** No Trino reference exists in OSS scope. The page is a dead link for OSS users.
**Citation:** Ledger §"Analytics / Trino"
**Remediation:** Delete the page or replace with a Cloud-only caveat.

## Clarity suggestions
None applicable; page is out of scope.

## Coverage notes
- **Ungrounded claim (entire page):** The page presents Trino SQL and JDBC connectivity as standard Cyoda features without any scope caveat. It does not say "In Cyoda Cloud" or "Licensed Enterprise tier" until reading about it is necessary. Readers of the OSS docs will attempt to find a Trino connector that does not exist.
