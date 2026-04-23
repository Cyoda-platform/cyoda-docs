# concepts section — Wave 2 review summary

**Pages reviewed:** 7
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

The concepts section is largely well-grounded and accurate. Five of seven pages (what-is-cyoda, entities-and-lifecycle, digital-twins-and-growth-path, authentication-and-identity, design-principles) have no correctness findings and present the core EDBMS mental model clearly. However, two pages introduce features that are not implemented in cyoda-go OSS:

1. **workflows-and-events.md** claims time-based and message-based triggers without grounding them in the codebase. These appear to be Cloud-only features.
2. **apis-and-surfaces.md** presents Trino SQL as one of three API surfaces available to all users, when Trino is a Cassandra-tier feature and not part of OSS. This is a structural problem: the entire page organization is built on a false premise for OSS readers.

These are not typos or minor inaccuracies; they are fundamental feature claims that are ungrounded in OSS and likely originated from Cloud documentation that was copied into the OSS path without verification.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| what-is-cyoda | 0 | 0 | 0 | 0 |
| entities-and-lifecycle | 0 | 0 | 0 | 0 |
| workflows-and-events | 0 | 0 | 1 | 1 |
| digital-twins-and-growth-path | 0 | 0 | 0 | 0 |
| apis-and-surfaces | 1 | 0 | 1 | 1 |
| authentication-and-identity | 0 | 0 | 0 | 1 |
| design-principles | 0 | 0 | 0 | 1 |
| **Total** | **1** | **0** | **2** | **4** |

## Cross-section issues noticed

- **Feature bleed from Cloud docs:** Both workflows-and-events and apis-and-surfaces introduce features (time-based triggers, Trino SQL, message-based triggers) that originated in Cyoda Cloud documentation but are not part of the OSS codebase. This suggests these pages may have been copied from Cloud docs and inadequately reviewed for the OSS context.

- **Scope confusion in apis-and-surfaces:** The page leads with "three distinct API surfaces" and organizes all content around that premise, including 18+ lines on Trino. For OSS readers, this is a false premise. The fix is not small edits but a structural rewrite: either OSS docs should say "two surfaces" and move Trino to Cloud docs, or there should be two separate versions of the page (one for OSS, one for Cloud).

- **Trigger model clarity gap:** The term "event" appears in design-principles, workflows-and-events, and authentication-and-identity with different scope. workflows-and-events should clarify early which trigger mechanisms are OSS vs. Cloud, because readers will encounter this page during the onboarding flow and make incorrect assumptions about what they can build.
