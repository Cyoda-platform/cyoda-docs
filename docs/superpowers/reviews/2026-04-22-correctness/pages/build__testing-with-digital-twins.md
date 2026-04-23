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
Correctness posture: clean. The page accurately characterizes in-memory mode as a test harness with identical API contracts to durable tiers and deterministic/fast properties. Claims about simulation capabilities and digital-twin property (same application logic across tiers, only non-functional properties differ) are well-founded. One clarity touch-up: the inline phrase "same API contracts (REST, gRPC, Trino)" lists Trino alongside surfaces that are callable today; Trino is on the roadmap and should be noted as such.

## Correctness findings

None.

## Clarity suggestions

### C1 — "Digital twin" terminology and scope
The page uses "digital twin" to mean "same application code, different tier." This is a useful property but the term may confuse readers expecting 1:1 behavioral fidelity with production. Clarify upfront: "In Cyoda, a 'digital twin' means the same application code (workflows, criteria, processors) runs identically on every storage tier. Non-functional properties (persistence, latency, concurrency model) differ, but business logic does not."

### C2 — Flag Trino as upcoming rather than listing it alongside REST/gRPC as-if-present
The inline phrase "same API contracts (REST, gRPC, Trino)" lists Trino alongside two surfaces that are callable today. Trino is on the roadmap and not yet callable at the pinned cyoda-go commit. Adjust to: "same API contracts (REST, gRPC today; Trino upcoming — see the [Trino reference](/reference/trino/) for roadmap status)."

## Coverage notes
- **Expected but missing:** In-memory mode configuration. The page mentions "Start cyoda-go with the in-memory profile" but does not show the environment variable or flag to use. Provide: "Set `CYODA_STORAGE_BACKEND=memory` or use the default config (memory is the application default)."
- **Present but thin:** Comparison with other test harnesses. The page does not discuss trade-offs vs. alternatives (Docker + real SQLite for reproducibility, mocked entity stores for unit tests). A brief "when to use in-memory" vs. "when to use durable" section would help.
