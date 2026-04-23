# concepts section — Wave 2 review summary

**Pages reviewed:** 7
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

The concepts section is largely well-grounded and accurate. Six of seven pages (what-is-cyoda, entities-and-lifecycle, digital-twins-and-growth-path, apis-and-surfaces, authentication-and-identity, design-principles) have no correctness findings and present the core EDBMS mental model clearly. One page has a Delete-post-#80 finding: **workflows-and-events.md** claims time-based and message-based triggers that are not implemented in cyoda-go (no timer scheduler, no message bus); these read like copy from elsewhere and should be removed or explicitly scoped as forthcoming when/if the corresponding mechanisms ship.

Separately, Trino is on the roadmap and will become available shortly; until it ships, the Trino content on `apis-and-surfaces.md` should carry an "upcoming / roadmap" banner rather than be treated as a correctness error.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| what-is-cyoda | 0 | 0 | 0 | 0 |
| entities-and-lifecycle | 0 | 0 | 0 | 0 |
| workflows-and-events | 0 | 0 | 1 | 1 |
| digital-twins-and-growth-path | 0 | 0 | 0 | 0 |
| apis-and-surfaces | 0 | 0 | 0 | 2 |
| authentication-and-identity | 0 | 0 | 0 | 1 |
| design-principles | 0 | 0 | 0 | 1 |
| **Total** | **0** | **0** | **1** | **5** |

## Cross-section issues noticed

- **Trino-as-present framing (roadmap feature).** `apis-and-surfaces.md` presents Trino as one of three callable surfaces today. Trino is on the roadmap and will become available shortly; the clean fix is an "upcoming" banner around the Trino content until it ships (see cross-cutting §1 for site-wide handling).

- **Time/message-trigger copy in `workflows-and-events.md`** does not match the current workflow engine (manual + automatic cascade only; no timer, no message bus). Flag for removal or scope-clarification.

- **Trigger model clarity gap:** The term "event" appears in design-principles, workflows-and-events, and authentication-and-identity with different scope. workflows-and-events should clarify early which trigger mechanisms are implemented today vs. forthcoming, because readers will encounter this page during the onboarding flow and make incorrect assumptions about what they can build.
