# build section — Wave 2 review summary

**Pages reviewed:** 8
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

Overall correctness posture: **one critical blocker** — the endpoint-path drift in working-with-entities and searching-entities (`/api/models/...` scheme does not exist; canonical is `/api/entity/...` and `/api/search/...`). Strong conceptual grounding elsewhere in workflows, entity models, and testing. Trino/SQL is on the roadmap but not yet callable at the pinned cyoda-go commit; analytics-with-sql and the Trino-alongside-REST-and-gRPC framing on testing-with-digital-twins need an "upcoming" banner rather than deletion. Recommend immediate fixes to the endpoint-path findings on working-with-entities and searching-entities before any public release.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| build__index | 0 | 0 | 0 | 0 |
| build__modeling-entities | 0 | 0 | 0 | 0 |
| build__workflows-and-processors | 2 | 0 | 0 | 2 |
| build__working-with-entities | 4 | 1 | 0 | 2 |
| build__searching-entities | 4 | 1 | 0 | 3 |
| build__analytics-with-sql | 0 | 0 | 0 | 1 |
| build__client-compute-nodes | 0 | 0 | 0 | 2 |
| build__testing-with-digital-twins | 0 | 0 | 0 | 2 |
| **Total** | **10** | **2** | **0** | **12** |

## Cross-section issues noticed

1. **Endpoint path drift across working-with-entities and searching-entities:** Both pages use a non-existent `/api/models/{name}/...` path scheme. The actual cyoda-go API uses `/api/entity/...` and `/api/search/...`. This is not a typo in one place but a systematic misunderstanding of the endpoint topology reflected in multiple examples. Recommend a single authoritative endpoint reference table (e.g., in a concepts page or API reference) that all example pages cite.

2. **Trino-as-present framing (roadmap feature):** The analytics-with-sql page and the testing-with-digital-twins inline mention of Trino treat it as callable today. Trino is on the roadmap and will become available shortly; the clean fix is an "upcoming / roadmap" banner rather than deletion or scope-tagging as Cloud-only (see cross-cutting §1).

3. **Outbound link audit:** modeling-entities and testing-with-digital-twins link to `/reference/trino/`. That page currently carries an awaiting-upstream banner; once Trino ships and the reference is filled in, these outbound links become live. No action needed beyond the site-wide sweep.

4. **Processor idempotency and at-least-once semantics:** Workflows-and-processors documents ASYNC_NEW_TX and processor retries but does not call out idempotency requirements. Working-with-entities and client-compute-nodes also lack explicit statements that processors will be retried on failure and should be designed for idempotence. This is a correctness gap across multiple pages.

5. **Auth context on compute nodes:** Client-compute-nodes is thorough but assumes Java/Kotlin readers. Language-agnostic guidance on extracting CloudEvent extension attributes would help Go, Python, and Rust users.
