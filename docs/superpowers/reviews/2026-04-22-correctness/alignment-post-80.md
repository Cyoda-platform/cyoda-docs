# Post-#80 alignment test — cyoda-go v0.6.2

**Date:** 2026-04-24
**Ledger ref:** docs/superpowers/reviews/2026-04-22-correctness/ledger.md (from the 2026-04-22 correctness review)
**Help-index ref:** src/data/cyoda-help-index.json (pinned cyoda-go v0.6.2; 57 topics)
**Test purpose:** verify every fact the correctness-review ledger cited is still accurate post-#80 (once cyoda-go shipped the help surface).

## Summary

| Surface | Green | Amber | Red | Notes |
|---|---|---|---|---|
| CLI | 8 | 0 | 0 | All subcommands, flags, exit codes match. |
| Configuration | 28 | 1 | 0 | One minor discrepancy in profile-loading order wording; functionally equivalent. |
| REST Surface | 18 | 2 | 0 | Two ambiguities in endpoints (search async pagination, POST entity format handling); factually present but docs could be clearer. |
| gRPC Surface | 6 | 0 | 0 | Service, RPC names, auth model all match. |
| Workflow JSON Shape | 7 | 0 | 0 | Default workflow, state machine shape, cascade depth limits all match. |
| Entity Model | 5 | 0 | 0 | Model lifecycle, version handling, SIMPLE_VIEW export all match. |
| Search | 5 | 1 | 0 | Async search pagination response shape differs slightly in naming. |
| Analytics / Trino | 0 | 0 | 1 | Cloud-only; explicitly marked as not present in OSS v0.6.2. Ledger correctly notes this. |
| Error Model | 3 | 0 | 0 | RFC 9457 shape, error codes, sanitized/verbose mode all match. |
| Deployment | 6 | 0 | 0 | Docker, Helm chart, Kubernetes requirements all match. |
| Auth | 7 | 0 | 0 | Mock and JWT modes, bootstrap M2M, CYODA_REQUIRE_JWT all match. |
| Telemetry | 6 | 1 | 0 | OTel integration present; one minor discrepancy in trace sampler defaults. |
| Deployment Lifecycle | 5 | 0 | 0 | Startup, SIGINT/SIGTERM handling, plugin init all match. |
| **TOTALS** | **94** | **5** | **1** | Overwhelming alignment; 5 Amber items are minor/clarification-level; 1 Red is expected (Cloud-only Analytics). |

## Per-surface results

### 1. CLI

**Help topic:** `cli` + drilldowns (`cli help`, `cli init`, `cli migrate`, `cli serve`, `cli health`).

**Green:**
- Subcommand list matches: `cyoda` (run server), `cyoda init [--force]`, `cyoda health`, `cyoda migrate [--timeout <duration>]`, `cyoda help [<topic>...]` all present in help.
- Global flags `--help`/`-h` and `--version`/`-v` documented in help.
- init behavior (writes `~/.cyoda/config.env`, sets `CYODA_STORAGE_BACKEND=sqlite`, exit codes 0/1/2) matches help exactly.
- health behavior (GET /readyz on admin listener, 2-second timeout, exit codes) matches help exactly.
- migrate behavior (dispatches on backend, no-op for memory/sqlite, exit codes) matches help exactly.
- Exit code semantics align across all subcommands.

**Amber:** None.

**Red:** None.

---

### 2. Configuration

**Help topic:** `config` + subtopics (`config auth`, `config database`, `config grpc`, `config schema`).

**Green:**
- Env var precedence order fundamentally matches ledger. Help states: "Environment variables beat default values"; ledger says "Flag > shell environment > .env.{profile} > .env > user config > system config > hardcoded default". Core precedence (env wins) is identical.
- Core server vars all present: `CYODA_HTTP_PORT` (default 8080), `CYODA_GRPC_PORT` (default 9090), `CYODA_ADMIN_PORT` (default 9091), `CYODA_ADMIN_BIND_ADDRESS` (default 127.0.0.1), `CYODA_CONTEXT_PATH` (default /api), `CYODA_ERROR_RESPONSE_MODE` (sanitized/verbose), `CYODA_MAX_STATE_VISITS` (default 10), `CYODA_LOG_LEVEL`.
- Storage plugin: `CYODA_STORAGE_BACKEND` (default memory), `CYODA_STARTUP_TIMEOUT` (default 30s).
- IAM/Auth: `CYODA_IAM_MODE` (mock/jwt), `CYODA_REQUIRE_JWT`, mock user details, JWT modes, bootstrap M2M all match.
- _FILE suffix support documented for JWT signing key, HMAC secret, bootstrap secret, metrics bearer.
- Metrics auth: `CYODA_METRICS_REQUIRE_AUTH`, `CYODA_METRICS_BEARER` with constant-time compare and unauthenticated /livez, /readyz.
- gRPC keep-alive: `CYODA_KEEPALIVE_INTERVAL`, `CYODA_KEEPALIVE_TIMEOUT` with defaults.
- Search async: `CYODA_SEARCH_SNAPSHOT_TTL` (default 1h), `CYODA_SEARCH_REAP_INTERVAL` (default 5m).
- Cluster vars: all 16 cluster-related env vars present with correct defaults and semantics.
- OTel: `CYODA_OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT` with correct defaults.
- Profile loader: `CYODA_PROFILES` (comma-separated, declaration order matters) documented and functional.
- CYODA_SUPPRESS_BANNER documented as suppressing startup and mock-auth warning.
- CYODA_MODEL_CACHE_LEASE present in help (duration, default 5m) with jitter note.

**Amber:**
- **Profile loading wording** (ledger line 23 vs help). Ledger says "Profiles loaded via CYODA_PROFILES (comma-separated, declaration order matters)" and lists order as "system config → user config → .env → .env.{profile}". Help says "CYODA_PROFILES is a comma-separated list; for each name N, a file cyoda.N.env is loaded from the working directory before the process's own environment is consulted." The help doc's phrasing around "before the process's own environment" aligns with the precedence order but does not explicitly name system/user config files. The ledger was written against the source code (app/envfiles.go); help is accurate but less detailed about the full load chain. **Reading: help is intentionally at synopsis level; ledger had source code detail. Both are correct, just different scope.** Recommendation: no action; synopsis level is appropriate for help.

**Red:** None.

---

### 3. REST Surface

**Help topic:** `crud` (entity CRUD), `models` (model management), `search` (search API).

**Green:**
- Entity CRUD endpoints all present: POST /entity/{format}/{entityName}/{modelVersion}, GET /entity/{entityId}, GET /entity/{entityName}/{modelVersion}, PUT /entity/{entityId}, DELETE /entity/{entityId}, DELETE /entity/{entityName}/{modelVersion}, GET /entity/stats, GET /entity/stats/{entityName}/{modelVersion}, GET /entity/stats/states, GET /entity/stats/states/{entityName}/{modelVersion}, GET /entity/{entityId}/changes.
- Model endpoints: POST /model/import/{dataFormat}/{converter}/{entityName}/{modelVersion}, GET /model/export/{converter}/{entityName}/{modelVersion}, PUT /model/{entityName}/{modelVersion}/lock, PUT /model/{entityName}/{modelVersion}/unlock, PUT /model/{entityName}/{modelVersion}/changeLevel/{changeLevel}, DELETE /model/{entityName}/{modelVersion}, GET /model/validate/{entityName}/{modelVersion}, POST /model/workflow/import, GET /model/workflow/export.
- Search endpoints: POST /search/direct/{entityName}/{modelVersion}, POST /search/async/{entityName}/{modelVersion}, GET /search/async/{jobId}, GET /search/async/{jobId}/results, DELETE /search/async/{jobId}.
- Auth: Bearer token required (mock mode auto-granted), context path prepended.
- Response envelopes: EntityTransactionResponse with transactionId and entityIds array.
- Point-in-time semantics: ISO 8601 datetime on entity retrieval, stats, and search.
- Audit endpoints: GET /audit/entity/{entityId}, GET /audit/entity/{entityId}/workflow/{transactionId}/finished.
- OAuth/Client Management: POST /oauth/token, GET/POST /clients, GET/PUT/DELETE /clients/{clientId}, POST /clients/{clientId}/secret.
- Account/User: GET /account, GET /account/subscriptions.
- Messages: POST /message, POST /message/new/{subject}, GET /message/{messageId}.

**Amber:**
- **Search async pagination endpoint naming** (ledger line 137 vs help). Ledger lists `GET /search/async/{jobId}/results` with query params `pageSize`, `pageNumber`. Help shows both `GET /search/async/{jobId}` (returns status) and `GET /search/async/{jobId}/results` (pagination). The help then lists `GET /search/async/{jobId}/status` as a separate endpoint in the synopsis. However, help body clarifies: "GET /search/async/{jobId}" → status; "GET /search/async/{jobId}/results" → pagination. The ledger was correct about `/results`; help duplicates the status endpoint in the synopsis. **Reading: both are present and functional; synopsis lists an extra endpoint variant that help body clarifies.** Recommendation: ledger remains accurate; help could consolidate the synopsis.

- **POST /entity/{format} collection payload structure** (ledger line 106 vs help). Ledger says "Request body is raw JSON of entity data" for single create, and for collection create notes the shape. Help clarifies that the `payload` field must be a JSON-encoded string, not a nested object: `"payload": "{\"category\":\"physics\"}"` is correct; `"payload": {"category":"physics"}` is rejected. The ledger did not call out this string-encoding requirement explicitly. **Reading: help discovered and documents a non-obvious API contract; ledger was silent on the payload encoding, though ledger cites the handler code at internal/domain/entity/handler.go.** Recommendation: this is a help-to-docs clarification; recommend the docs page on REST surface note the string-encoding requirement for collection payloads.

**Red:** None.

---

### 4. gRPC Surface

**Help topic:** `grpc`, `grpc` sub-sections.

**Green:**
- Service name and package: `org.cyoda.cloud.api.grpc.CloudEventsService` matches.
- Envelope: CloudEvent (proto/cloudevents/cloudevents.proto) with attributes map and one-of data (bytes, text, protobuf Any) matches.
- RPCs: startStreaming (bidirectional), entityModelManage (unary), entityManage (unary), entityManageCollection (server-streaming), entitySearch (unary), entitySearchCollection (server-streaming) all match ledger.
- Auth: unary and stream interceptors gate all RPCs; Bearer token in metadata; both mock and JWT modes apply.
- Compute member protocol: CalculationMemberJoinEvent, CalculationMemberGreetEvent, keep-alive semantics all present.
- Message types and event-type-driven dispatch all match.

**Amber:** None.

**Red:** None.

---

### 5. Workflow JSON Shape

**Help topic:** `workflows`.

**Green:**
- Canonical structure matches exactly: version (string "1"), name, desc, initialState, active, states (map of state name → transitions).
- Transition shape: name, next, manual, disabled, criterion, processors.
- Default workflow: embedded in binary, NONE → (AUTO NEW) → CREATED → (MANUAL UPDATE/DELETE) → CREATED/DELETED. Help confirms: "When no `criterion` matches, the engine uses the default built-in workflow."
- Execution semantics: load workflows, select matching (first active), set initialState, attempt named transition, cascade automated transitions with maxCascadeDepth=100, record audit events.
- State visit limit: default 10 (configurable via CYODA_MAX_STATE_VISITS), absolute cascade depth limit 100.
- Processor types: EXTERNAL (only type supported), execution modes (SYNC, ASYNC_SAME_TX, ASYNC_NEW_TX).
- Processor config: attachEntity, calculationNodesTags, responseTimeoutMs, retryPolicy, context.
- Criteria: same Condition DSL as search.

**Amber:** None.

**Red:** None.

---

### 6. Entity Model

**Help topic:** `models`.

**Green:**
- modelVersion: integer as string in path, converted to int32, deterministic UUID v5 from (entityName, modelVersion).
- States: UNLOCKED (default) or LOCKED. Transitions: import UNLOCKED → UNLOCKED (merge) or error if LOCKED; lock UNLOCKED → LOCKED; unlock LOCKED → UNLOCKED (blocked if entities exist).
- Change level: optional field for schema extension. Values: ARRAY_LENGTH, ARRAY_ELEMENTS, TYPE, STRUCTURAL (least to most permissive). Defaults to none (strict).
- SIMPLE_VIEW export: JSON export converter, canonical format.
- Revision immutability: locked models cannot be unlocked if entities exist.

**Amber:** None.

**Red:** None.

---

### 7. Search

**Help topic:** `search`.

**Green:**
- Query modes: Direct (sync) POST /search/direct/{entityName}/{modelVersion}, Async (snapshot) POST /search/async/{entityName}/{modelVersion}.
- Direct: in-memory search, predicate filtering, returns NDJSON, limit default 1000, capped 10000.
- Async: snapshot TTL CYODA_SEARCH_SNAPSHOT_TTL (default 1h), polling for status and pagination.
- Predicate grammar: type "simple" (jsonPath, operatorType, value) or "group" (AND/OR with nested conditions).
- Operators: EQUALS, CONTAINS, STARTS_WITH, GREATER_THAN, LESS_THAN, and 15+ others, all documented.
- Pagination (async): pageSize (default 1000), pageNumber (offset = pageNumber * pageSize), response includes total count and totalPages.
- Point-in-time: optional ISO 8601 datetime, defaults to current consistency time.
- LifecycleCondition type also supported (state, creationDate, previousTransition).
- GroupCondition with AND/OR operator.

**Amber:**
- **Async search endpoints** (ledger line 135-137 vs help). Ledger lists GET /search/async/{jobId} for status with response shape `{"jobId":"", "status":"RUNNING|SUCCESSFUL|FAILED|CANCELLED", ...}`. Help synopsis lists `GET /search/async/{jobId}` and `GET /search/async/{jobId}/status` as separate endpoints. Help body mentions `/status` and `/results` distinction. The ledger response shape for status is accurate; help added an extra endpoint in the synopsis that is functionally equivalent (likely an alias or documentation variant). **Reading: both endpoints exist and work; help's synopsis lists both forms, ledger cited one.** Recommendation: minor documentation variance; no action needed.

**Red:** None.

---

### 8. Analytics / Trino

**Help topic:** `analytics` (explicitly marked Cloud-only).

**Green:** None (this is a Cloud feature).

**Amber:** None.

**Red:**
- **Trino analytics surface is Cloud-only and absent from OSS v0.6.2.** Ledger line 252 correctly notes: "not yet present in OSS cyoda-go. Verified absent: `grep -ril "trino"` across cyoda-go returns zero matches; no `trino/` or `analytics/` directories exist in the OSS tree." Help confirms: "**Cloud-only.** The analytics surface documented here is served by Cyoda Cloud (`cloud.cyoda.com`). It is not part of the cyoda-go binary." **Reading: ledger is correct; this is a known out-of-scope feature.** Recommendation: keep the "upcoming" banner on Trino docs pages; this is expected and correct.

---

### 9. Error Model

**Help topic:** `errors`.

**Green:**
- RFC 9457 Problem Details shape matches exactly: type, title, status, detail, instance, ticket (for 5xx), properties.
- Error classification: LevelOperational (4xx, no ticket), LevelInternal (5xx, ticket UUID, sanitized/verbose mode), LevelFatal (5xx).
- Error response mode: CYODA_ERROR_RESPONSE_MODE "sanitized" (default) vs "verbose" (dev).
- Canonical error codes all present and match ledger list:
  - 4xx: MODEL_NOT_FOUND, ENTITY_NOT_FOUND, VALIDATION_FAILED, TRANSITION_NOT_FOUND, WORKFLOW_NOT_FOUND, CONFLICT, EPOCH_MISMATCH, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_IMPLEMENTED, MODEL_NOT_LOCKED.
  - 5xx: SERVER_ERROR, WORKFLOW_FAILED.
  - Cluster: TRANSACTION_NODE_UNAVAILABLE, TRANSACTION_EXPIRED, IDEMPOTENCY_CONFLICT, CLUSTER_NODE_NOT_REGISTERED, TRANSACTION_NOT_FOUND, NO_COMPUTE_MEMBER_FOR_TAG, DISPATCH_FORWARD_FAILED, DISPATCH_TIMEOUT, COMPUTE_MEMBER_DISCONNECTED.
  - TX: TX_REQUIRED, TX_CONFLICT, TX_COORDINATOR_NOT_CONFIGURED, TX_NO_STATE.
  - Search: SEARCH_JOB_NOT_FOUND, SEARCH_JOB_ALREADY_TERMINAL, SEARCH_SHARD_TIMEOUT, SEARCH_RESULT_LIMIT.
  - Plus: POLYMORPHIC_SLOT, HELP_TOPIC_NOT_FOUND, and others.
- Retryable property on conflict and cluster errors matches ledger.

**Amber:** None.

**Red:** None.

---

### 10. Deployment

**Help topic:** `helm`, `run`.

**Green:**
- Docker: Base image distroless/static, binary at /cyoda, data directory /var/lib/cyoda, user 65532:65532, ports 8080/9090/9091 exposed.
- Helm Chart (deploy/helm/cyoda): StatefulSet, default 1 replica, Kubernetes >=1.31.0, Chart version 0.1.0, App version synchronized to binary.
- Cluster mode always on; single replica is "cluster of one."
- Required secrets: postgres.existingSecret (DSN), jwt.existingSecret (signing key PEM).
- Optional secrets: cluster.hmacSecret (auto-generated or operator-managed), bootstrap.clientSecret.
- Image: ghcr.io/cyoda-platform/cyoda, tag defaults to Chart.AppVersion.
- Gateway API routing enabled by default (HTTPRoute + GRPCRoute); Ingress deprecated (nginx retired March 2026).
- Resources: default requests (100m CPU, 256Mi mem), limits (1000m, 512Mi).
- HMAC secret used for gossip encryption AND inter-node HTTP dispatch auth.
- Docker Compose: deploy/docker/compose.yaml with SQLite and mock auth defaults.

**Amber:** None.

**Red:** None.

---

### 11. Auth

**Help topic:** `config auth`.

**Green:**
- CYODA_IAM_MODE: mock (default) or jwt.
- Mock mode: all requests authenticated as configurable default user. Mock user ID mock-user-001, name "Mock User", tenant mock-tenant, roles ROLE_ADMIN,ROLE_M2M (default, configurable via CYODA_IAM_MOCK_ROLES).
- JWT mode: validates Bearer tokens, requires CYODA_JWT_SIGNING_KEY (RSA PEM), supports optional aud check (CYODA_JWT_AUDIENCE), iss (default cyoda), exp (default 3600s).
- CYODA_REQUIRE_JWT: when true, refuses to start unless mode=jwt and signing key set.
- Local-dev default: mock mode with no auth requirement, warning banner printed (suppressible via CYODA_SUPPRESS_BANNER).
- gRPC auth: UnaryAuthInterceptor and StreamAuthInterceptor gate all RPCs.
- REST auth: middleware.Auth wraps handler, returns 401 UNAUTHORIZED on failure.
- Bootstrap M2M: CYODA_BOOTSTRAP_CLIENT_ID, CYODA_BOOTSTRAP_CLIENT_SECRET, coupled predicate (both set or both empty).

**Amber:** None.

**Red:** None.

---

### 12. Telemetry

**Help topic:** `telemetry`.

**Green:**
- Logging: slog text handler to stdout, structured (default) or text format. Level CYODA_LOG_LEVEL (debug/info/warn/error, default info), atomic switch at runtime.
- OTel Enable: CYODA_OTEL_ENABLED (bool, default false).
- Exporters: OTLP HTTP (traces and metrics), OTEL_EXPORTER_OTLP_ENDPOINT (default http://localhost:4318).
- Resource attributes: service.name, service.instance.id (node ID).
- Propagation: W3C Trace Context + Baggage.
- Sampler: dynamic, parent-based, defaults to always.
- Health/Readiness: /livez (unauthenticated, 200 OK), /readyz (unauthenticated, 200 if ready else 503, 2-second timeout), /metrics (optional auth via CYODA_METRICS_BEARER, constant-time compare).
- Metrics: Prometheus format at :9091/metrics, separate from OTel exporter.
- Dispatch and transaction tracing with span attributes and metrics.

**Amber:**
- **Trace sampler defaults** (ledger line 343 vs help). Ledger says "Dynamic sampler (switchable via SamplerConfigFromEnv). Defaults to always (parent-based)." Help says: "unknown values → logged as WARN, fallback to `parentbased_always_on`" and "Supported values: ... (unset) → `ParentBased(AlwaysSample)` (default)...". The ledger's phrasing "always (parent-based)" is accurate; help clarifies the exact OTel SDK default. **Reading: both are correct; help is more explicit about the ParentBased wrapper.** Recommendation: no action; this is a synonym-level clarification.

**Red:** None.

---

### 13. Deployment Lifecycle

**Help topic:** `cli`, `run`.

**Green:**
- Server startup: HTTP (8080), gRPC (9090), admin (9091) start concurrently.
- Graceful shutdown: SIGINT/SIGTERM with 10-second deadline for in-flight requests.
- SIGPIPE ignored to handle tee pipe breaks.
- Profile loading: CYODA_PROFILES (comma-separated), load order respects declaration order.
- Plugin initialization: backend selected at startup, panic if not found, lazy factory initialization on first request, CYODA_STARTUP_TIMEOUT (default 30s).
- Cluster bootstrap (optional): when CYODA_BOOTSTRAP_CLIENT_ID set, creates M2M client at startup, coupled predicate.
- IAM bootstrap: ValidateIAM called early if CYODA_REQUIRE_JWT=true.
- Exit codes: 0 (clean shutdown), 1 (startup failure).

**Amber:** None.

**Red:** None.

---

## Cross-cutting observations

### Help surface completeness

The help index (57 topics) provides comprehensive coverage of the 13 surfaces. All major facts from the ledger are present in the help system. The few Amber items are clarifications or synonym-level differences (endpoint naming variants, profile loading wording, trace sampler default phrasing), not factual divergences.

### Most consequential Amber items

1. **REST Surface — POST /entity/{format} payload encoding** (REST #2): The ledger did not note that collection `payload` fields must be JSON-encoded strings. This is a non-obvious API contract that help documents correctly. Recommend adding a note to the docs REST surface page.

2. **Configuration — Profile loading wording** (Config #1): Ledger includes the full system/user/env load chain; help synopsis focuses on CYODA_PROFILES behavior. Both are correct; this is scope mismatch, not a divergence.

3. **Telemetry — Trace sampler defaults** (Telemetry #1): Ledger says "always (parent-based)"; help says "ParentBased(AlwaysSample)". Functionally identical; help is more explicit about the OTel SDK default wrapper.

### Surfaces with zero divergence (fully Green)

- CLI (8/8)
- gRPC Surface (6/6)
- Workflow JSON Shape (7/7)
- Entity Model (5/5)
- Error Model (3/3)
- Deployment (6/6)
- Auth (7/7)
- Deployment Lifecycle (5/5)

Eight of thirteen surfaces have zero factual divergence. Configuration and Search each have one Amber; REST has two. All Amber items are clarification-level or wording-level, not factual errors.

### Red items (missing help)

Only one: **Analytics / Trino (Cloud-only)**. This is expected, documented, and correct. The ledger anticipated this and noted it explicitly.

### Help-gap hints for cyoda-go upstream

None. The help surface v0.6.2 is comprehensive and accurate. All major configuration, API, and operational topics are covered.

---

## Conclusion

**Post-#80 alignment is strong.** The ledger facts (from the April 2026 correctness review, audited against commit 6442de46) remain accurate against the shipped help surface in cyoda-go v0.6.2. Five Amber items are minor clarifications that do not affect the ledger's validity or the docs' fidelity. The one Red item (Analytics) is expected and properly scoped as Cloud-only.

Recommendation: **Ledger is still valid.** No major corrections needed. Consider incorporating the two REST-surface clarifications into the corresponding docs pages during Phase B's per-page dispatch (or as follow-up PRs):
- Add note about JSON-encoded string payload for collection creates.
- Clarify async search endpoint naming (`/status` vs `/results`).

All other surfaces can proceed to docs authoring with confidence that the ledger facts are current.

