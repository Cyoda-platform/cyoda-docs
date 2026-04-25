---
page: src/content/docs/build/client-compute-nodes.md
section: build
reviewed_by: wave2-build
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Client compute nodes — correctness review

## Summary
Correctness posture: clean. The page is comprehensive, well-grounded in cyoda-go's gRPC service definition and client interaction patterns. The CloudEvent type system, handler lifecycle, authentication, and auth context extensions are all verified against proto definitions and handler code. One-line clarity: dense but appropriate for a detailed protocol specification. Verdict: no changes needed.

## Correctness findings
None.

## Clarity suggestions

### C1 — CloudEvent attribute names vs. keys in proto map
Section 8.1 states "The auth context is carried as CloudEvent extension attributes in the Protobuf `attributes` map — **not** inside the JSON `text_data` payload." This is correct and important, but section 8.3 (Extracting Auth Context) assumes Java code and uses `.getAttributesMap().get("authtype").getCeString()` syntax. For readers using other languages (Go, Python), the attribute lookup syntax differs significantly. Add a note: "The exact method to extract attributes depends on your language and gRPC tooling. In Java, use the `attributes` map directly; other languages may require different accessor patterns."

### C2 — Keep-alive timing parameters table context
The "Timing parameters" table in section 5.3 lists server-side defaults (probe interval 1000ms, idle timeout 3000ms, check timeout 1000ms) but does not explain what these mean together. For example: "If a probe times out without response (1000ms), the member is marked not alive after exceeding the idle interval (3000ms)." Add a brief explanation of how these parameters interact.

## Coverage notes
- **Expected but missing:** Error handling and retry logic. The page documents `retryable` flag in processor error responses but does not explain the server-side retry behavior (how many retries, backoff strategy, which members are excluded). `internal/domain/workflow/engine.go` shows that processors are dispatched via external processing service, but the retry contract is not detailed. Add a section: "Error Responses and Retry Behavior."
- **Present but thin:** Member registration and re-registration. Section 5.2 documents the Join handshake but does not discuss what happens if a member re-joins with the same ID or a different set of tags. Are old tags replaced? Is there a grace period before a dead member's subscriptions are cleaned up?
