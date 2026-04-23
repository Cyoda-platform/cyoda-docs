---
page: src/content/docs/build/testing-with-digital-twins.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Testing with digital twins — correctness review

## Summary
Correctness posture: clean. The page accurately characterizes in-memory mode as a test harness with identical API contracts to durable tiers and deterministic/fast properties. Claims about simulation capabilities and digital-twin property (same application logic across tiers, only non-functional properties differ) are well-founded. One-line clarity: accessible and motivating. Verdict: no changes needed beyond one Fix-now correction about the Trino reference.

## Correctness findings

### F1 — Claim that same API contracts include Trino — **Fix now**
**Doc says:** "same API contracts (REST, gRPC, Trino)"
**Ground truth:** OSS cyoda-go has no Trino surface (see ledger §"Analytics / Trino" and build/analytics-with-sql.md review). Trino is available only in Cloud/Cassandra tier.
**Citation:** Ledger §"Analytics / Trino"
**Remediation:** Update the claim to: "same API contracts (REST, gRPC; Trino available in Cloud tier only)."

## Clarity suggestions

### C1 — "Digital twin" terminology and scope
The page uses "digital twin" to mean "same application code, different tier" (in-memory vs. durable). This is a useful property but the term "digital twin" may confuse readers expecting the term to imply 1:1 behavioral fidelity with production. Clarify upfront: "In Cyoda, a 'digital twin' means the same application code (workflows, criteria, processors) runs identically on every storage tier. Non-functional properties (persistence, latency, concurrency model) differ, but business logic does not."

## Coverage notes
- **Expected but missing:** In-memory mode configuration. The page mentions "Start cyoda-go with the in-memory profile" but does not show the environment variable or flag to use. Provide: "Set `CYODA_STORAGE_BACKEND=memory` or use the default config (memory is the default)."
- **Present but thin:** Comparison with other test harnesses. The page does not discuss trade-offs compared to alternatives (e.g., Docker + real SQLite for reproducibility, mocked entity stores for unit tests). A brief "when to use in-memory" vs. "when to use durable" section would help.
