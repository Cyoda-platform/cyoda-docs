# cyoda-go ground-truth ledger

**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
**Scope:** OSS cyoda-go only. Cassandra-tier (`cyoda-go-cassandra`) is confidential and out of scope; deltas are noted without elaboration.

**Ledger status:** v1. Covers 12 surfaces. Citations are spot-checked but not exhaustively verified; downstream Wave 2 section reviewers cite their own findings against cyoda-go independently. Known miscite as of v1: `CYODA_MAX_STATE_VISITS` safety-net constant lives in `internal/domain/workflow/engine.go:L31` (`maxCascadeDepth = 100`), not `app/config.go:L31` as entered below.

## CLI

**References:** cmd/cyoda/main.go, cmd/cyoda/init.go, cmd/cyoda/health.go, cmd/cyoda/migrate.go

- **Subcommands:** `cyoda` (run server), `cyoda --help` (help), `cyoda init [--force]` (init user config), `cyoda health` (probe /readyz), `cyoda migrate [--timeout <duration>]` (schema migration).
- **Flags:** `--help`/`-h` (global help), `--force` (init subcommand, overwrite existing config), `--timeout` (migrate subcommand, default 5m).
- **init behavior** (cmd/cyoda/init.go:21-69): writes starter user config to ~/.cyoda/config.env (or per-OS equivalent); idempotent unless `--force`; skips if system config exists at standard paths (unless `--force`); writes CYODA_STORAGE_BACKEND=sqlite with default sqlite path. Exit codes: 0 (success/idempotent), 1 (I/O error), 2 (flag parse error).
- **health behavior** (cmd/cyoda/health.go:18-36): GET /readyz on admin listener (default port 9091 via CYODA_ADMIN_PORT); 2-second timeout; exits 0 on 200, 1 otherwise. Used by Docker HEALTHCHECK and Helm readinessProbe.
- **migrate behavior** (cmd/cyoda/migrate.go:45-70): Dispatches on CYODA_STORAGE_BACKEND: memory/sqlite no-op (exit 0); postgres runs plugin migrations. Refuses if DB schema newer than code. Exit codes: 0 (success), 1 (runtime error), 2 (flag parse error).

## Configuration

**References:** app/config.go, cmd/cyoda/main.go, app/envfiles.go

### Env var precedence
Flag > shell environment > .env.{profile} (declaration order) > .env > user config file > system config file > hardcoded default. Profiles loaded via CYODA_PROFILES (comma-separated, declaration order matters).

### Core server vars
- `CYODA_HTTP_PORT` (int, default 8080) — HTTP listen port
- `CYODA_GRPC_PORT` (int, default 9090) — gRPC listen port
- `CYODA_ADMIN_PORT` (int, default 9091) — admin listener port (/livez, /readyz, /metrics)
- `CYODA_ADMIN_BIND_ADDRESS` (string, default 127.0.0.1) — admin bind address
- `CYODA_CONTEXT_PATH` (string, default /api) — context path prefix for all REST routes
- `CYODA_ERROR_RESPONSE_MODE` (string, default sanitized) — error response detail: "sanitized" (prod) or "verbose" (dev)
- `CYODA_MAX_STATE_VISITS` (int, default 10) — max visits per state in workflow cascade (absolute safety cap: 100, in `internal/domain/workflow/engine.go:L31` — NOT config.go)
- `CYODA_LOG_LEVEL` (string, default info) — debug | info | warn | error
- `CYODA_SUPPRESS_BANNER` (string, default false) — suppress startup banner and mock-auth warning (CI/tests only)

### Storage plugin
- `CYODA_STORAGE_BACKEND` (string, default memory) — plugin name: memory, sqlite, postgres
- `CYODA_STARTUP_TIMEOUT` (duration, default 30s) — deadline for plugin.NewFactory and TM init

### IAM/Authentication
- `CYODA_IAM_MODE` (string, default mock) — mock | jwt
- `CYODA_REQUIRE_JWT` (bool, default false) — when true, refuse to start unless mode=jwt and signing key set (app/config.go:L254-269)
- **Mock mode defaults:**
  - `CYODA_IAM_MOCK_ROLES` (csv, default ROLE_ADMIN,ROLE_M2M) — mock user roles; empty value logs warning and uses defaults
  - Mock user: ID mock-user-001, name "Mock User", tenant mock-tenant
- **JWT mode:**
  - `CYODA_JWT_SIGNING_KEY` (PEM or base64-encoded PEM) — RSA private key, required in jwt mode
  - `CYODA_JWT_ISSUER` (string, default cyoda) — JWT iss claim
  - `CYODA_JWT_AUDIENCE` (string, default empty) — required aud claim; empty disables check
  - `CYODA_JWT_EXPIRY_SECONDS` (int, default 3600) — token lifetime

### Bootstrap M2M client (jwt mode only)
- `CYODA_BOOTSTRAP_CLIENT_ID` (string) — bootstrap M2M client ID; coupled with CLIENT_SECRET (both-set or both-empty required)
- `CYODA_BOOTSTRAP_CLIENT_SECRET` (string) — bootstrap client secret
- `CYODA_BOOTSTRAP_TENANT_ID` (string, default default-tenant) — bootstrap client tenant
- `CYODA_BOOTSTRAP_USER_ID` (string, default admin) — bootstrap client user ID
- `CYODA_BOOTSTRAP_ROLES` (csv, default ROLE_ADMIN,ROLE_M2M) — bootstrap client roles

### Credentials with _FILE suffix support
Reading from file takes precedence when both var and var_FILE are set. Trailing whitespace stripped.
- `CYODA_POSTGRES_URL_FILE` (path) → `CYODA_POSTGRES_URL`
- `CYODA_JWT_SIGNING_KEY_FILE` (path) → `CYODA_JWT_SIGNING_KEY`
- `CYODA_HMAC_SECRET_FILE` (path) → `CYODA_HMAC_SECRET` (cluster gossip encryption)
- `CYODA_BOOTSTRAP_CLIENT_SECRET_FILE` (path) → `CYODA_BOOTSTRAP_CLIENT_SECRET`
- `CYODA_METRICS_BEARER_FILE` (path) → `CYODA_METRICS_BEARER`

### Metrics auth
- `CYODA_METRICS_REQUIRE_AUTH` (bool, default false) — gate /metrics behind static Bearer token
- `CYODA_METRICS_BEARER` (string) — static Bearer token for /metrics (constant-time compare); empty leaves /metrics unauth. Coupled with CYODA_METRICS_REQUIRE_AUTH: startup fails if required but unset. /livez and /readyz stay unauthenticated regardless (kubelet carries no bearer).

### gRPC keep-alive
- `CYODA_KEEPALIVE_INTERVAL` (int seconds, default 10)
- `CYODA_KEEPALIVE_TIMEOUT` (int seconds, default 30)

### Observability
- `CYODA_OTEL_ENABLED` (bool, default false) — enable OpenTelemetry tracing/metrics
- `OTEL_EXPORTER_OTLP_ENDPOINT` (standard OTel var, default http://localhost:4318)

### Search async
- `CYODA_SEARCH_SNAPSHOT_TTL` (duration, default 1h) — lifetime of async search snapshots
- `CYODA_SEARCH_REAP_INTERVAL` (duration, default 5m) — interval for reaping expired snapshots

### Cluster (when enabled)
- `CYODA_CLUSTER_ENABLED` (bool, default false)
- `CYODA_NODE_ID` (string) — node identifier
- `CYODA_NODE_ADDR` (string, default http://localhost:8080) — node address for peers
- `CYODA_GOSSIP_ADDR` (string, default :7946) — gossip listen address
- `CYODA_SEED_NODES` (csv) — comma-separated seed node addresses
- `CYODA_GOSSIP_STABILITY_WINDOW` (duration, default 2s)
- `CYODA_TX_TTL` (duration, default 60s) — transaction lifetime
- `CYODA_TX_REAP_INTERVAL` (duration, default 10s)
- `CYODA_PROXY_TIMEOUT` (duration, default 30s)
- `CYODA_TX_OUTCOME_TTL` (duration, default 5m)
- `CYODA_DISPATCH_WAIT_TIMEOUT` (duration, default 5s)
- `CYODA_DISPATCH_FORWARD_TIMEOUT` (duration, default 30s)

## REST Surface

**References:** api/openapi.yaml, internal/domain/entity/handler.go, internal/domain/search/handler.go, internal/domain/model/handler.go

### Core endpoint structure
All endpoints prepend `CYODA_CONTEXT_PATH` (default /api). Auth: Bearer token required (mock mode: auto-granted to default user; jwt mode: validated JWT).

### Entity Management

- **POST /entity/{format}/{entityName}/{modelVersion}** — Create entities. Request body is raw JSON of entity data. Response is array of EntityTransactionResponse objects `[{"transactionId": "uuid", "entityIds": ["uuid1", ...]}]`. Supports optional `:transition` path segment for named transition on creation.
- **GET /entity/{entityId}** — Get single entity by ID. Query params: `pointInTime` (ISO 8601), `transactionId` (UUID). Returns entity envelope.
- **GET /entity/{entityName}/{modelVersion}** — List entities for model. Supports pagination (not specified in current OAS; sync search model: limit capped at 10000).
- **PUT /entity/{entityId}** — Update entity.
- **DELETE /entity/{entityId}** — Delete entity.
- **DELETE /entity/{entityName}/{modelVersion}** — Delete entities for model.
- **GET /entity/stats** — Global entity statistics. Query: `pointInTime` (ISO 8601).
- **GET /entity/stats/{entityName}/{modelVersion}** — Stats for model. Query: `pointInTime`.
- **GET /entity/stats/states** — Stats grouped by state (all models). Query: `pointInTime`, `states` (csv state list, capped 1000 to protect SQL). internal/domain/entity/handler.go:L31.
- **GET /entity/stats/states/{entityName}/{modelVersion}** — Stats grouped by state for model. Query: `pointInTime`, `states` (csv).
- **GET /entity/{entityId}/changes** — Change metadata for entity. Query: `pointInTime`.

### Entity Model Management

- **POST /model/import/{dataFormat}/{converter}/{entityName}/{modelVersion}** — Import model. `dataFormat`: JSON (implied). `converter`: SAMPLE_DATA (only supported). Request body: sample JSON data (10 MB max). Returns ModelID. State transitions: UNLOCKED → UNLOCKED (merge schema) or → error if already LOCKED. internal/domain/model/service.go:L79.
- **GET /model/export/{converter}/{entityName}/{modelVersion}** — Export model metadata. `converter`: SIMPLE_VIEW (canonical export format). Returns JSON model descriptor.
- **PUT /model/{entityName}/{modelVersion}/lock** — Lock model (prevent further imports). Transitions UNLOCKED → LOCKED. internal/domain/model/service.go:L129.
- **PUT /model/{entityName}/{modelVersion}/unlock** — Unlock model (allow imports). Transitions LOCKED → UNLOCKED. Blocked if entities exist. internal/domain/model/service.go:L149.
- **PUT /model/{entityName}/{modelVersion}/changeLevel/{changeLevel}** — Set change level for model extension. Values: ARRAY_LENGTH, ARRAY_ELEMENTS, TYPE, STRUCTURAL (least to most permissive). internal/domain/model/service.go:L168.
- **DELETE /model/{entityName}/{modelVersion}** — Delete model. Blocked if LOCKED or entities exist.
- **GET /model/validate/{entityName}/{modelVersion}** — Validate model schema.
- **POST /model/workflow/import** — Import workflows into model.
- **GET /model/workflow/export** — Export workflows from model.

### Search

**Request body for all search:** JSON condition object (predicate grammar, e.g. `{"type":"simple","jsonPath":"$.field","operatorType":"EQUALS","value":"x"}`). Response: NDJSON (one JSON object per line) for sync; JSON with pagination for async.

- **POST /search/direct/{entityName}/{modelVersion}** — Synchronous search. Query params: `limit` (int, default 1000, capped 10000), `pointInTime` (ISO 8601). Returns NDJSON stream of entity envelopes. Max result set 10000 (default 1000). internal/domain/search/handler.go:L36-93.
- **POST /search/async/{entityName}/{modelVersion}** — Submit async search job. Returns jobID string (UUID).
- **GET /search/async/{jobId}** — Get job status. Returns `{"jobId":"", "status":"RUNNING|SUCCESSFUL|FAILED|CANCELLED", "total":N, "createTime":"ISO8601", "finishTime":"ISO8601", "calcTimeMs":N}`.
- **GET /search/async/{jobId}/results** — Get paginated results. Query params: `pageSize` (int, default 1000), `pageNumber` (int, default 0; offset = pageNumber * pageSize). Returns `{"content":[entities], "page":{"number":N, "size":N, "totalElements":N, "totalPages":N}}`. internal/domain/search/handler.go:L151-210.
- **DELETE /search/async/{jobId}** — Cancel job.

**Point-in-time semantics:** ISO 8601 datetime (e.g., '2035-01-01T12:00:00Z'). Defaults to current consistency time if not provided. Supported on entity retrieval, stats, and search endpoints.

### Audit

- **GET /audit/entity/{entityId}** — Audit log for entity.
- **GET /audit/entity/{entityId}/workflow/{transactionId}/finished** — Get workflow execution result for transaction.

### OAuth / Client Management

- **POST /oauth/token** — Token endpoint (OAuth 2.0 client credentials). `-u "clientId:clientSecret"` with grant_type=client_credentials. Returns `{"access_token":"jwt", ...}`.
- **GET/POST /clients** — List/create M2M clients (requires SUPER_USER role).
- **GET/PUT/DELETE /clients/{clientId}** — Manage M2M client.
- **POST /clients/{clientId}/secret** — Reset client secret.

### Account / User

- **GET /account** — Get current user account details, tenant, roles.
- **GET /account/subscriptions** — Get subscription info, limits, feature toggles.

### Messages

- **POST /message** — Send/receive messages.
- **POST /message/new/{subject}** — Create new message.
- **GET /message/{messageId}** — Get message.

### SQL Schema (not fully implemented)

- **GET /sql/schema** — List schemas.
- **POST /sql/schema/genTables/{entityModelId}** — Generate SQL tables from model.

## gRPC Surface

**References:** proto/cyoda/cyoda-cloud-api.proto, internal/grpc/server.go

### Service: CloudEventsService

Envelope: CloudEvent (proto/cloudevents/cloudevents.proto) with attributes map and one-of data (bytes, text, or protobuf Any).

**RPCs:**
- `startStreaming(stream CloudEvent) returns (stream CloudEvent)` — Bidirectional streaming for entity model and entity management.
- `entityModelManage(CloudEvent) returns (CloudEvent)` — Model lifecycle (import, lock, unlock, delete).
- `entityManage(CloudEvent) returns (CloudEvent)` — Entity CRUD.
- `entityManageCollection(CloudEvent) returns (stream CloudEvent)` — Batch entity operations.
- `entitySearch(CloudEvent) returns (CloudEvent)` — Single entity search.
- `entitySearchCollection(CloudEvent) returns (stream CloudEvent)` — Batch search.

**Auth:** Unary and stream interceptors (UnaryAuthInterceptor, StreamAuthInterceptor) gate all RPCs. internal/grpc/server.go:L54-56.

## Workflow JSON Shape

**References:** internal/domain/workflow/default_workflow.json, internal/domain/workflow/engine.go, internal/domain/workflow/transitions.go

**Canonical structure:**
```json
{
  "version": "1",
  "name": "workflow-name",
  "desc": "description",
  "initialState": "NONE",
  "active": true,
  "states": {
    "STATE_NAME": {
      "transitions": [
        {
          "name": "transition-name",
          "next": "next-state",
          "manual": false
        }
      ]
    }
  }
}
```

**Default workflow** (internal/domain/workflow/default_workflow.json): NONE → (AUTO NEW) → CREATED → (MANUAL UPDATE/DELETE) → CREATED/DELETED. Embedded in binary; used when no custom workflows imported.

**Execution semantics** (internal/domain/workflow/engine.go:L89-150):
1. Load workflows for model; if none, use default.
2. Select matching workflow (selector logic unspecified; assumes first active).
3. Set entity.Meta.State to initialState.
4. If transitionName provided, attempt named transition.
5. Cascade automated (manual=false) transitions until no more applicable (maxCascadeDepth=100 absolute limit, internal/domain/workflow/engine.go:L31).
6. Record state machine audit events (SMEventStarted, SMEventFinished) with transactionID for correlation.

**State visit limit:** defaultMaxStateVisits (default 10 at internal/domain/workflow/engine.go:L34, configurable via CYODA_MAX_STATE_VISITS) prevents infinite loops within cascade.

## Entity Model

**References:** internal/domain/model/service.go, internal/domain/model/handler.go, app/config.go

- **modelVersion:** Integer version number (1, 2, 3...) as string in path params, converted to int32. Deterministic UUID v5 derived from (entityName, modelVersion) string via NewSHA1(NameSpaceURL). internal/domain/model/handler.go:L38-40.
- **States:** UNLOCKED (default, allows import) or LOCKED (blocks import, allows entity creation). Transitions: import UNLOCKED → UNLOCKED (merge schema) → error if LOCKED; lock UNLOCKED → LOCKED; unlock LOCKED → UNLOCKED (blocked if entities exist).
- **Change level:** Optional field enabling schema extension on import. Values: ARRAY_LENGTH (least), ARRAY_ELEMENTS, TYPE, STRUCTURAL (most). Defaults to none (strict validation). Extending model saves updated schema to store. internal/domain/entity/handler.go:L54-92.
- **SIMPLE_VIEW export:** JSON export converter for model metadata. Matches Cyoda Cloud's canonical export format.
- **Revision immutability:** Locked models cannot be unlocked if entities exist; unlocked models can be reimported (schema merge). internal/domain/model/service.go:L79-87.

## Search

**References:** internal/domain/search/service.go, internal/domain/search/handler.go, internal/domain/search/filter_translate.go

- **Query modes:**
  - **Direct (sync):** POST /search/direct/{entityName}/{modelVersion}. In-memory search with predicate filtering. Returns NDJSON. Limit capped 10000 (default 1000). internal/domain/search/handler.go:L36-93.
  - **Async (snapshot):** POST /search/async/{entityName}/{modelVersion}, then GET /search/async/{jobId}/results with pagination. Snapshot TTL: CYODA_SEARCH_SNAPSHOT_TTL (default 1h). internal/domain/search/handler.go:L99-130, L151-210.

- **Predicate grammar:** Type "simple" (single condition with jsonPath, operatorType, value) or "group" (AND/OR operator, nested conditions). Operators: EQUALS, CONTAINS, STARTS_WITH, GREATER_THAN, LESS_THAN, etc. internal/domain/search/filter_translate.go translates to SQL WHERE when plugin supports Searcher interface; falls back to in-memory filtering.

- **Pagination (async):** pageSize (default 1000), pageNumber (offset = pageNumber * pageSize). Response includes total count and calculated totalPages. internal/domain/search/handler.go:L173-210.

- **Point-in-time parameter:** Optional ISO 8601 datetime; defaults to current consistency time. Enables temporal search.

## Analytics / Trino

**Status: not implemented in OSS cyoda-go.**

Verified absent: `grep -ril "trino"` across `~/go-projects/cyoda-light/cyoda-go` (`.go`, `.yaml`, `.md`) returns zero matches; no `trino/` or `analytics/` directories exist in the OSS tree. No JDBC surface, no Trino catalog, no `AS OF` SQL equivalent ships in OSS as of the pinned SHA.

**Implication for docs:** Any cyoda-docs page claiming a Trino JDBC URL, Trino catalog layout, or SQL `AS OF` equivalent as a feature of cyoda-go OSS is **ungrounded**. Trino integration is a Cassandra-tier surface (cyoda-go-cassandra, confidential) and therefore belongs to Cyoda Cloud documentation, not OSS-path cyoda-docs pages.

## Error Model

**References:** internal/common/errors.go, internal/common/error_codes.go

**RFC 9457 Problem Details shape:**
```json
{
  "type": "about:blank",
  "title": "HTTP status text",
  "status": <http-status>,
  "detail": "error detail (sanitized or verbose mode)",
  "instance": "<request-path>",
  "ticket": "<uuid> (for 5xx only)",
  "properties": {...}
}
```

**Error classification:**
- LevelOperational (4xx): client error, no ticket. Detail = message.
- LevelInternal (5xx): unexpected error, ticket UUID generated. Detail suppressed in sanitized mode; shown in verbose.
- LevelFatal (5xx): unrecoverable, ticket UUID, marks system unhealthy.

**Error response mode:** CYODA_ERROR_RESPONSE_MODE: "sanitized" (prod default) suppresses internal detail; "verbose" (dev) includes err.Error() as detail. Ticket UUID always logged regardless.

**Canonical error codes (internal/common/error_codes.go):**
- 4xx: MODEL_NOT_FOUND, ENTITY_NOT_FOUND, VALIDATION_FAILED, TRANSITION_NOT_FOUND, WORKFLOW_NOT_FOUND, CONFLICT, EPOCH_MISMATCH, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_IMPLEMENTED.
- 5xx: SERVER_ERROR, WORKFLOW_FAILED.
- Cluster: TRANSACTION_NODE_UNAVAILABLE, TRANSACTION_EXPIRED, IDEMPOTENCY_CONFLICT, CLUSTER_NODE_NOT_REGISTERED, TRANSACTION_NOT_FOUND, NO_COMPUTE_MEMBER_FOR_TAG, DISPATCH_FORWARD_FAILED, DISPATCH_TIMEOUT, COMPUTE_MEMBER_DISCONNECTED.
- TX: TX_REQUIRED, TX_CONFLICT, TX_COORDINATOR_NOT_CONFIGURED, TX_NO_STATE.
- Search: SEARCH_JOB_NOT_FOUND, SEARCH_JOB_ALREADY_TERMINAL, SEARCH_SHARD_TIMEOUT, SEARCH_RESULT_LIMIT.
- Model: MODEL_NOT_LOCKED.

**Retryable:** CONFLICT (409), EPOCH_MISMATCH (when cluster node transitions). Transactional aborts (40001/40P01 in postgres) auto-routed to Conflict(). internal/common/errors.go:L77-80.

## Deployment

**References:** deploy/docker/Dockerfile, deploy/helm/cyoda/values.yaml, cmd/cyoda/main.go

### Docker
- **Base image:** distroless/static (no shell).
- **Binary path:** /cyoda (referenced by healthcheck and ENTRYPOINT). deploy/docker/Dockerfile:L20-24.
- **Data directory:** /var/lib/cyoda (pre-staged with correct ownership for sqlite). deploy/docker/Dockerfile:L25.
- **User:** 65532:65532 (non-root).
- **Ports exposed:** 8080 (HTTP), 9090 (gRPC), 9091 (admin).

### Helm Chart (deploy/helm/cyoda/)
- **Replicas:** default 1 (cluster of one). Scale via `--set replicas=N`.
- **Cluster mode:** always on; single replica behaves as cluster-of-one.
- **Required secrets:** postgres.existingSecret (DSN), jwt.existingSecret (signing key PEM).
- **Optional secrets:** cluster.hmacSecret (auto-generated if unset, but GitOps controllers must provide existingSecret), bootstrap.clientSecret.
- **Bootstrap M2M:** opt-in; enabled when clientId non-empty; coupled predicate enforced (both-set or both-empty).
- **Image:** ghcr.io/cyoda-platform/cyoda (tag defaults to Chart.AppVersion).
- **Gateway API routing:** enabled by default (HTTPRoute + GRPCRoute); Ingress deprecated (ngix retired March 2026).
- **Resources:** default requests (100m CPU, 256Mi mem), limits (1000m, 512Mi).
- **HMAC secret:** used for gossip encryption AND inter-node HTTP dispatch auth.

## Auth

**References:** internal/iam/mock/authentication.go, cmd/cyoda/main.go, app/config.go

- **CYODA_IAM_MODE:**
  - **mock** (default): All requests authenticated as configurable default user. Mock user: ID mock-user-001, name "Mock User", tenant mock-tenant, roles ROLE_ADMIN,ROLE_M2M (default, configurable via CYODA_IAM_MOCK_ROLES).
  - **jwt**: Validates Bearer tokens. Requires CYODA_JWT_SIGNING_KEY (RSA PEM). Supports optional aud check (CYODA_JWT_AUDIENCE), iss (default cyoda), exp (default 3600s).

- **CYODA_REQUIRE_JWT:** When true, refuses to start unless mode=jwt and signing key set. Enables production-safe bootstrap where silent mock-auth fallback is a security hazard. app/config.go:L254-269.

- **Local-dev default:** mock mode with no auth requirement. Warning banner printed (suppressible via CYODA_SUPPRESS_BANNER). cmd/cyoda/main.go:L192-213.

- **gRPC auth:** UnaryAuthInterceptor and StreamAuthInterceptor gate all CloudEventsService RPCs. Auth service contract: Authenticate(ctx, request) → UserContext. internal/grpc/server.go:L54-56.

- **REST auth:** middleware.Auth wraps handler; returns 401 UNAUTHORIZED if Authenticate fails. internal/api/middleware/auth.go:L11-23.

## Telemetry

**References:** internal/observability/init.go, internal/admin/admin.go, internal/logging/logging.go

### Logging
- **Handler:** slog text handler to stdout. Structured JSON (or text format per slog default).
- **Level:** CYODA_LOG_LEVEL (debug, info, warn, error; default info). Atomic switch at runtime via slog.LevelVar. internal/logging/logging.go:L10.

### Observability (OTel)
- **Enable:** CYODA_OTEL_ENABLED (bool, default false).
- **Exporters:** OTLP HTTP (traces and metrics). OTEL_EXPORTER_OTLP_ENDPOINT (default http://localhost:4318).
- **Resource attributes:** service.name (instance name), service.instance.id (node ID).
- **Propagation:** W3C Trace Context + Baggage.
- **Sampler:** Dynamic sampler (switchable via SamplerConfigFromEnv). Defaults to always (parent-based).
- **Init guard:** sync.Once; subsequent calls return cached shutdown function. internal/observability/init.go:L38-110.

### Health/Readiness
- **/livez** (unauthenticated) — Always returns 200 OK.
- **/readyz** (unauthenticated) — Returns 200 if readiness check passes (callback invoked per probe), else 503. 2-second timeout enforced by client to prevent deadlock. cmd/cyoda/health.go:L14-36.
- **/metrics** (optional auth) — Prometheus metrics (promhttp.Handler). Auth gated by constant-time Bearer compare if CYODA_METRICS_BEARER set. internal/admin/admin.go:L34-54, internal/admin/auth.go:L9-51.

### Tracing
- **Dispatch tracing:** tx ID, processor ID, compute node correlation.
- **Transaction tracing:** tx lifecycle events.
- **Messaging tracing:** event propagation headers.

## Deployment Lifecycle

**References:** cmd/cyoda/main.go:L50-150, internal/cluster/lifecycle/manager.go (implied)

- **Server startup:** HTTP (8080), gRPC (9090), admin (9091). Graceful shutdown on SIGINT/SIGTERM with 10-second deadline. SIGPIPE ignored to handle tee pipe breaks. cmd/cyoda/main.go:L82-150.

- **Profile loading:** CYODA_PROFILES (comma-separated). Load order: system config → user config → .env → .env.{profile} (in order). Shell env always wins. app/envfiles.go.

- **Plugin initialization:** Storage backend plugin selected at startup; panic if not found. Factory creates stores on first request (lazy). Startup timeout: CYODA_STARTUP_TIMEOUT (default 30s). cmd/cyoda/main.go:L86-92.

- **Cluster bootstrap (optional):** When CYODA_BOOTSTRAP_CLIENT_ID set, creates M2M client at startup. Coupled predicate: both must be set or both empty; half-configured rejected with error. app/config.go:L100-105.

- **IAM bootstrap:** ValidateIAM called early if CYODA_REQUIRE_JWT=true. cmd/cyoda/main.go:L54-57.
