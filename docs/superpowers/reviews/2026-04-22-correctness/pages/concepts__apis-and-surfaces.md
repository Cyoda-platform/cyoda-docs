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
Clean correctness posture on the two surfaces present at the pinned commit (REST, gRPC); accurate descriptions verified against handlers and proto. The third surface (Trino SQL) is on the roadmap and upcoming, but not yet callable at this SHA — the page presents it alongside REST and gRPC without flagging that it is forthcoming. Clarity fix: add an "upcoming / roadmap" banner around the Trino content; no correctness finding against Trino-specific claims (those cannot be verified until the feature ships).

## Correctness findings

None.

## Clarity suggestions

### C1 — Surface selection logic should be earlier
The page jumps into detailed descriptions of each surface before answering "when should I pick each one?" The "Which surface, when?" section contains the most actionable guidance and should appear before or alongside the detailed descriptions, not after. A first-time reader might read the full Trino section before learning that Trino is for analytics and REST is the default.

### C2 — Trino surface should carry an "upcoming" banner
Trino is on the roadmap and not yet callable at the pinned cyoda-go commit. The page currently lists it among the "three distinct API surfaces" without flagging it as forthcoming, so readers may attempt to use it immediately. Add a banner or inline callout at the top of the Trino section: "Trino SQL is on the roadmap and not yet available in cyoda-go — see Cyoda Cloud for current availability." When Trino ships, the banner is dropped. Specifics of the surface (catalog name, JDBC URL pattern, `AS OF` equivalent) are not reviewed here and should be verified against the implementation when it lands.

## Coverage notes

- **Expected but missing:** A statement that REST is the default surface for most Cyoda applications.
