---
page: src/content/docs/concepts/workflows-and-events.md
section: concepts
reviewed_by: wave2-concepts
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Workflows and events — correctness review

## Summary
Minor correctness issues. The page correctly explains the state machine model, manual vs. automatic transitions, processors, and the audit trail. However, two trigger types mentioned (time-based and message-based) are not implemented in cyoda-go OSS and appear to be Cloud-only features. These claims lack grounding in the codebase and should be either removed for OSS readers or clearly marked as future/Cloud features.

## Correctness findings

### F1 — Time-based and message-based triggers ungrounded in OSS — **Delete post-#80**
**Doc says:** "Transitions fire in response to events. The shape of the event determines how the transition is triggered: ... **Time-based** — schedules or delays expressed in the workflow; the platform fires the transition when the clock reaches the configured point. ... **Message-based** — an incoming message (an ingest event, an upstream notification) drives the transition." (L28-38)

**Ground truth:** The workflow engine (internal/domain/workflow/engine.go) implements only two trigger paths: (1) manual transitions via ManualTransition/attemptTransition, (2) automatic transitions via cascadeAutomated on state entry. No timer scheduler, no message bus, no ingest-event handler exists in the OSS codebase. The default workflow (internal/domain/workflow/default_workflow.json) shows only manual and automatic (manual=false) transitions with no time or message fields. Grep of the entire codebase for "timer", "schedule", "message", "ingest" in workflow/* yields zero results related to triggers.

**Citation:** `internal/domain/workflow/engine.go:L89-155` (Execute method: manual or cascade), `internal/domain/workflow/engine.go:L159-216` (ManualTransition), `internal/domain/workflow/engine.go:L405-491` (cascadeAutomated), `internal/domain/workflow/default_workflow.json` (no time/message fields)

**Remediation:** Remove the time-based and message-based trigger descriptions from the OSS concepts page. These are Cloud-only features (likely in cyoda-go-cassandra). Move them to Cyoda Cloud documentation or mark clearly as "future" if the intent is to position them for roadmap alignment. The concepts section should reflect what OSS users can actually implement.

## Clarity suggestions

### C1 — Processors description incomplete on execution context
The page correctly mentions that processors run synchronously or asynchronously (L60-61), but does not explain the atomicity implications. The ASYNC_NEW_TX mode (runs in a savepoint, failures are non-fatal) vs. SYNC/ASYNC_SAME_TX (inline, failures abort the transition) distinction is critical for correctness modeling. A sentence clarifying the behavioral difference would help readers understand when to use each mode.

## Coverage notes

- **Expected but missing:** Explanation of the three processor execution modes (SYNC, ASYNC_SAME_TX, ASYNC_NEW_TX) and their atomicity contracts. The page says processors "run synchronously within the transition's transaction, or asynchronously alongside it" but does not distinguish ASYNC_NEW_TX's savepoint isolation from ASYNC_SAME_TX's shared transaction.
- **Present but thin:** Criteria gating is mentioned but the predicate grammar (SIMPLE, GROUP, FUNCTION) is not introduced at the concept level. Readers understand the concept but not the implementation options.
