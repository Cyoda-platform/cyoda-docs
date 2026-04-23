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
Trino is on the roadmap and not yet callable at the pinned cyoda-go commit. The page presents the Trino SQL reference (virtual tables, projections, JDBC connection, `point_time` column) as if it were already available. Correctness of those specifics (catalog naming, JDBC URL pattern, type mapping, `AS OF` equivalent) cannot be verified at this SHA and is out of scope for this review. Clarity fix: the awaiting-upstream banner should be sharpened or replaced with an explicit "upcoming / roadmap" banner so OSS readers understand the feature is forthcoming and not yet callable.

## Correctness findings

None. (Surface specifics are unverifiable until Trino ships; deferred.)

## Clarity suggestions

### C1 — Replace/sharpen the awaiting-upstream banner with an explicit "upcoming" notice
The current awaiting-upstream banner signals future documentation but does not say clearly that Trino is not yet callable. OSS readers cannot infer from the prose whether they can try the JDBC connection today. Sharpen to: "Trino SQL is on the roadmap and not yet available in cyoda-go at this release. This page documents the planned surface; names and shapes (catalog name, JDBC URL pattern, `AS OF` equivalent, projection rules) may change before release. For availability in Cyoda Cloud, see [Cyoda Cloud → Analytics]." When Trino ships, the banner is dropped and the reference is re-verified.

### C2 — Scope clarity about JDBC hostnames
The page includes Cloud-specific JDBC hostnames (`*.eu.cyoda.net`). For the reference page, either keep these as a Cyoda Cloud example with a "Cyoda Cloud only" caption, or defer them until the OSS JDBC surface is defined and its URL pattern is known.

## Coverage notes

- **Present but thin (until Trino ships):** All surface specifics (virtual tables, catalog, type mapping, polymorphic fields, complete worked example, JDBC connection) are unverifiable at this SHA. Defer detailed correctness review to when the feature lands.
