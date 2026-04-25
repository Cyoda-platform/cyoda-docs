---
page: src/content/docs/concepts/design-principles.mdx
section: concepts
reviewed_by: wave2-concepts
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Design principles — correctness review

## Summary
Clean correctness posture. The page articulates the core mental model correctly: entities as durable state machines, transitions as the atomic unit of change, history as the storage model, automatic vs. manual transitions, and tier-agnostic semantics. All claims are grounded in the workflow engine and entity model implementations. The TL;DR summary is accurate and well-structured.

## Correctness findings

None.

## Clarity suggestions

### C1 — "Events drive the machine" section should clarify what is and is not implemented
L51-56 states "Events — 'file uploaded', 'payment received', 'clock tick' — trigger transitions." The examples are good but the phrase "clock tick" implies time-based triggers, which are not implemented in OSS (see workflows-and-events findings). This could mislead readers about what triggers they can actually implement. Suggest revising to list only the implemented trigger types: manual transitions (actor-driven), automatic transitions (on state entry), and processor-driven side-effects, or add a note that time-based triggers are available in Cyoda Cloud.

## Coverage notes

- **Present but thin:** The page correctly positions automatic and manual transitions (L34-35, L72) but does not explain the cascade behavior or visit-limit safety nets. These are implementation details appropriate for Build rather than Design Principles, so coverage is adequate.
- **Ungrounded claim (minor):** L53 mentions "clock tick" as an event that triggers transitions. This is not implemented in cyoda-go OSS. See workflows-and-events.md F1 for detail.
