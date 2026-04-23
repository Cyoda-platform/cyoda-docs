---
page: src/content/docs/build/workflows-and-processors.mdx
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Workflows and processors — correctness review

## Summary
Correctness posture: minor. The page is well-grounded in cyoda-go's workflow engine implementation. Most claims about execution semantics, state-machine audit events, cascade depth, state visit limits, and processor execution modes are verified against `internal/domain/workflow/engine.go`. Two fixable inaccuracies: `version` JSON field spelling and conflation of two separate cascade safety limits. One-line clarity: comprehensive and well-organized. Verdict: fix the two Fix-now items.

## Correctness findings

### F1 — Workflow version field — **Fix now**
**Doc says:** "version": "1.0" (in JSON examples; Section "Workflow Object")
**Ground truth:** `internal/domain/workflow/default_workflow.json:L1` specifies `"version": "1"` (integer string, not float). The schema does not validate 1.0 format.
**Citation:** `internal/domain/workflow/default_workflow.json:L1-2`
**Remediation:** Update all JSON examples to use `"version": "1"` not `"version": "1.0"`.

### F2 — Cascade depth limit constant name — **Fix now**
**Doc says:** Refers to "CYODA_MAX_STATE_VISITS" as the safety net for "max visits per state" (implicit wording around cascade).
**Ground truth:** Cascade has TWO separate limits: `maxCascadeDepth = 100` (absolute depth cap across all states) and `defaultMaxStateVisits = 10` (per-state visit limit). CYODA_MAX_STATE_VISITS configures only the per-state limit, not the cascade depth. `internal/domain/workflow/engine.go:L31-34` and L416-424.
**Citation:** `internal/domain/workflow/engine.go:L31,L34,L416-424`
**Remediation:** Clarify that CYODA_MAX_STATE_VISITS applies only to per-state visit limits within a single cascade. Add one sentence noting the absolute 100-step cascade depth safety net is hard-coded.

## Clarity suggestions

### C1 — Workflow selection logic under "Multiple Workflows per Model"
The section states "the platform evaluates each active workflow's criterion to select the applicable workflow" but does not specify the selection order or whether the first match wins. Readers implementing custom criteria may assume parallel evaluation when it is actually sequential (first active workflow whose criterion matches is selected). `internal/domain/workflow/engine.go:L286-328` iterates in order and returns on first match. Add: "The platform evaluates active workflows in the order they are defined and uses the first whose criterion matches (or the first with no criterion, which matches unconditionally)."

### C2 — Processor idempotency and ASYNC_NEW_TX
The page documents ASYNC_NEW_TX as "deferred execution in a separate, independent transaction" but does not warn that processors may be retried on failure and should be idempotent. Readers building processors may assume at-most-once execution. `internal/domain/workflow/engine.go:L545-553` logs ASYNC_NEW_TX failures as non-fatal and continues the pipeline, implying retry is possible upstream. Add a one-sentence note: "Processors should be idempotent; failed ASYNC_NEW_TX processors may be retried."

## Coverage notes
- **Expected but missing:** Processor idempotency guarantees. The page documents execution modes but not the at-least-once / idempotency contract. This belongs in the processor section or a separate note on reliability.
- **Present but thin:** Function criteria and processor routing by tags. The section on "Calculation Nodes Tags" exists but is very brief and could benefit from a worked example showing tag matching (e.g., a processor configured with tags "validation,data-quality" matching a member with tags ["data-quality", "extra"]).
