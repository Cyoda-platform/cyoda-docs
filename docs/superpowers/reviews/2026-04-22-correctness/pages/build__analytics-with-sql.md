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
Trino is on the roadmap and not yet callable at the pinned cyoda-go commit. The page describes the Trino/JDBC/SQL analytics surface as if it were already available. Correctness of specific claims (JDBC URL pattern, catalog layout, point_time column name, `AS OF` equivalent) cannot be verified at this SHA and is out of scope for this review — they will be reviewed once Trino ships. For now the page needs a clarity fix: add an "upcoming / roadmap" banner so readers know the feature is forthcoming and not yet callable.

## Correctness findings

None. (Trino-specific claims are not verifiable until the feature ships; deferred.)

## Clarity suggestions

### C1 — Add an "upcoming / roadmap" banner at the top of the page
Trino is on the roadmap and not yet callable at the pinned cyoda-go commit. Readers arriving here today will attempt to connect JDBC clients and run SQL, and they will fail silently (endpoint/catalog not present). Add a banner at the top: "SQL analytics via Trino is on the roadmap; not yet available in cyoda-go. For availability in Cyoda Cloud, see [Cyoda Cloud → Analytics]. This page documents the planned surface; names and shapes may change before release." When Trino ships, drop the banner and re-verify the page's specifics against the implementation.

## Coverage notes

- **Present but thin (until Trino ships):** The specifics (virtual SQL tables, `point_time` column, JDBC connection pattern, projection rules, `AS OF` equivalent) are all unverifiable at the pinned commit. Defer review of these specifics to when the feature lands.
