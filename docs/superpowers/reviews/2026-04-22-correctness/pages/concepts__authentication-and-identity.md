---
page: src/content/docs/concepts/authentication-and-identity.md
section: concepts
reviewed_by: wave2-concepts
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Authentication and identity — correctness review

## Summary
Clean correctness posture. The page accurately describes the OAuth 2.0 authorization model, M2M credentials, on-behalf-of token exchange (grounded in internal/auth/token.go:handleTokenExchange), and external key trust (grounded in internal/auth/trusted.go). All core concepts are correctly positioned and verifiable in the codebase. The reference to cyoda-go configuration is accurate; the note about moving to help system is appropriate for post-#80 planning.

## Correctness findings

None.

## Clarity suggestions

### C1 — On-behalf-of exchange mechanism not explained in concepts page
The page mentions token exchange (L35-44) but does not explain the mechanics: how does the service pass the user's token alongside its own? The phrase "presents its own token plus the user's token" (L39) assumes readers understand the subject_token flow. A single sentence clarifying "the calling service includes the user's JWT in a token-exchange request" would improve clarity without requiring implementation details.

## Coverage notes

- **Present but thin:** External key trust (L46-56) is described at the concept level but lacks explanation of the actual mechanics. Readers understand the business logic (trust external IdP, map subjects to internal identities) but not the configuration or JWKS endpoint details. This is appropriate for a concepts page but note that the Build section should expand on this.
- **Expected but missing:** The page does not mention the CYODA_REQUIRE_JWT configuration flag, which enforces production-safe bootstrap where mock-auth fallback is forbidden. This is an important operational concept but belongs in Run configuration, not here.
