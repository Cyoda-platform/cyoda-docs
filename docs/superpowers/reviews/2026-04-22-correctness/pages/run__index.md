---
page: src/content/docs/run/index.mdx
section: run
reviewed_by: wave2-run
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Run — correctness review

## Summary

The index page correctly frames the packaging tiers and their storage backends. All claims about the relationship between packaging layers (desktop, docker, kubernetes, cloud) and storage tiers (in-memory, sqlite, postgres, cassandra) align with the ledger and cyoda-go source. The edition and license claims are accurate. No factual errors found.

## Correctness findings

None.

## Clarity suggestions

None.

## Coverage notes

- **Present but thin:** The page says "pick your packaging by what you need to operate"; it could benefit from a note that all tiers run identical application semantics and the same workflow engine, so the choice is purely operational/durability, not feature-driven.
- **Ungrounded claim (framing):** "When you outgrow desktop" mentions three signs but the prose doesn't emphasize that HA/operational scale are operator concerns, not application concerns. That said, the framing is not incorrect—just brief.
