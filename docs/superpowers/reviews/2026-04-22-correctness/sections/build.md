# build section — Wave 2 review summary

**Pages reviewed:** 8
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

Overall correctness posture: **two critical blockers** (analytics-with-sql, working-with-entities / searching-entities endpoint paths), balanced by **strong conceptual grounding** in workflows, entity models, and testing. The build section is fundamental to user onboarding; the critical-path pages (workflows, entities, search) are largely sound on concepts but have high-friction endpoint errors that will cause all curl examples to fail in practice. Trino/SQL is entirely out-of-scope for OSS but presented as a core feature. Recommend immediate fixes to F1–F5 in working-with-entities and searching-entities before any public release.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| build__index | 0 | 0 | 0 | 0 |
| build__modeling-entities | 0 | 0 | 0 | 0 |
| build__workflows-and-processors | 2 | 0 | 0 | 2 |
| build__working-with-entities | 4 | 1 | 0 | 2 |
| build__searching-entities | 4 | 1 | 0 | 3 |
| build__analytics-with-sql | 0 | 0 | 3 | 0 |
| build__client-compute-nodes | 0 | 0 | 0 | 2 |
| build__testing-with-digital-twins | 1 | 0 | 0 | 1 |
| **Total** | **11** | **2** | **3** | **10** |

## Cross-section issues noticed

1. **Endpoint path drift across working-with-entities and searching-entities:** Both pages use a non-existent `/api/models/{name}/...` path scheme. The actual cyoda-go API uses `/api/entity/...` and `/api/search/...`. This is not a typo in one place but a systematic misunderstanding of the endpoint topology reflected in multiple examples. Recommend a single authoritative endpoint reference table (e.g., in a concepts page or API reference) that all example pages cite.

2. **Scope contamination: Trino/SQL as OSS feature:** The analytics-with-sql page presents Trino connectivity and JDBC as standard Cyoda features without mentioning it is Cloud-only. This directly contradicts the ledger and scope guardrails. Readers of the OSS docs will be confused when they cannot find a Trino connector. Recommend explicit scope tags on Cloud-only pages or move the page entirely to a separate "Cyoda Cloud" documentation set.

3. **Placeholder reference links:** Modeling-entities and testing-with-digital-twins reference pages that do not exist in OSS scope (e.g., `/reference/trino/`). These create broken-link debt when readers follow the "Where to go next" sections. Audit all outbound links for scope consistency.

4. **Processor idempotency and at-least-once semantics:** Workflows-and-processors documents ASYNC_NEW_TX and processor retries but does not call out idempotency requirements. Working-with-entities and client-compute-nodes also lack explicit statements that processors will be retried on failure and should be designed for idempotence. This is a correctness gap across multiple pages.

5. **Auth context on compute nodes:** Client-compute-nodes is thorough but assumes Java/Kotlin readers. Language-agnostic guidance on extracting CloudEvent extension attributes would help Go, Python, and Rust users.
