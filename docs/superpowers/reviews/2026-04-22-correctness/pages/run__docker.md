---
page: src/content/docs/run/docker.md
section: run
reviewed_by: wave2-run
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Docker — correctness review

## Summary

The Docker page correctly describes the use cases, observability model, and composition patterns. One concrete claim is incorrect: the environment variable name for storage backend selection. This is the same bug as in desktop.md and will cause users attempting to configure PostgreSQL to fail silently (the wrong env var is ignored and the app falls back to in-memory).

## Correctness findings

### F1 — Storage backend environment variable name — **Fix now**
**Doc says:** "Point cyoda-go at a PostgreSQL instance by setting `CYODA_STORAGE=postgres`" (L41)
**Ground truth:** The environment variable is `CYODA_STORAGE_BACKEND`, not `CYODA_STORAGE`. `app/config.go:L110` reads from `CYODA_STORAGE_BACKEND`.
**Citation:** `app/config.go:L110`
**Remediation:** Change `CYODA_STORAGE=postgres` to `CYODA_STORAGE_BACKEND=postgres` on line 41. Add a pointer that the DSN is `CYODA_POSTGRES_URL` (or `CYODA_POSTGRES_URL_FILE` for file-based secret).

## Clarity suggestions

### C1 — Compose example pinning
Line 33 says "wires this up end-to-end; for production you will run PostgreSQL separately and pass only the DSN." It does not say how to set the DSN (via `CYODA_POSTGRES_URL`, or via the compose file). A brief note like "set `CYODA_POSTGRES_URL` via `.env` or `-e` on `docker run`" would help.

### C2 — Observability completeness
The observability section mentions logs, metrics, and traces but does not mention health probes (`/livez` and `/readyz`) on the admin port. For operators familiar with Kubernetes probes, a note that `/readyz` is available on the admin port would be useful.

### C3 — Data directory lifecycle
No mention of the Docker data directory `/var/lib/cyoda` (pre-staged with correct ownership for sqlite). Users migrating from desktop (where SQLite uses XDG paths) to Docker may be confused about where the database ends up.

## Coverage notes

- **Present but thin:** The page mentions admin endpoints elsewhere but does not cover the admin port (`CYODA_ADMIN_PORT`, default 9091) or its bind address (`CYODA_ADMIN_BIND_ADDRESS`, default 127.0.0.1). Docker users running behind a reverse proxy need to know this.
- **Expected but missing:** The `_FILE` secret pattern (`CYODA_POSTGRES_URL_FILE`, etc.) is a Docker-native idiom but not mentioned here. A brief pointer would help operators familiar with Docker secrets.
- **Ungrounded claim:** "postgres separately and pass only the DSN" — does not say which variable (`CYODA_POSTGRES_URL`) or which mechanism (env, file via `_FILE` suffix). Readers need a concrete pointer.
