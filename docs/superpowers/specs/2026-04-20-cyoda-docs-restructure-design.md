# cyoda-docs restructure for the cyoda-go pivot

**Date:** 2026-04-20
**Status:** Design — pending implementation plan
**Author:** Paul Schleger (with Claude Code)

## Summary

Restructure `docs.cyoda.net` around the cyoda-go pivot. Separate application development (tier-agnostic, "digital twins") from cloud/self-hosted operations (tier-specific). Make cyoda-go's local-first workflow the primary onramp. Shift technical specifics out of prose and into build-time ingests from canonical cyoda-go artefacts. Add 2026-era AI discoverability so both humans and AI assistants can consume the site cleanly.

This is a full restructure and content rewrite — a big-bang pivot, not an incremental migration.

## Context

Cyoda is releasing **cyoda-go**, an open-source Go EDBMS that replicates the Cyoda platform's APIs, gRPC integrations, entity lifecycle, and workflow engine. It ships in three modes (In-Memory, SQLite, PostgreSQL) via Homebrew/curl/deb/rpm/Docker/Helm. A proprietary `cyoda-go-cassandra` backend is in development as the eventual replacement for today's Java/Kotlin Cyoda Cloud implementation.

The "growth path" is a single platform expressed at four tiers:

```
In-Memory  →  SQLite  →  PostgreSQL  →  Cassandra
(local dev/AI)  (embedded)  (clustered prod)  (enterprise / Cyoda Cloud)
```

All four are **digital twins** — the application code is the same everywhere; only non-functional characteristics differ.

Today's `docs.cyoda.net` assumes Cyoda Cloud is the only runtime and mixes developer-facing material with cloud-operator material in a flat `guides/` folder. This structure does not serve the new audience split:

- **Application developers** building against cyoda-go locally, whichever backend they choose.
- **Operators** running cyoda-go on their own infrastructure, or running on Cyoda Cloud (test/demo today; commercial SLA offering coming).

## Scope

**docs.cyoda.net is a navigator and a conceptual manual**, not a technical encyclopedia.

| In scope | Out of scope |
|---|---|
| Version-agnostic concepts, architecture, design patterns, decision criteria | Version-specific parameter tables, flag lists, endpoint schemas retyped as prose |
| Orientation: who builds what, runs where | Contributor / internal architecture docs (those stay in `cyoda-go` repo) |
| Ingest points for cyoda-go-generated artefacts (CLI help, env vars, OpenAPI, gRPC protos, helm values) | Proprietary `cyoda-go-cassandra` internals (confidential) |
| Cyoda Cloud product manual (provisioning, entitlements, IAM, status) | Self-hosted IAM mechanics (delegated to cyoda-go) |
| AI/LLM discoverability (Tier A) | MCP docs server (deferred to follow-up issue) |
| Redirects from every current URL | Preservation of placeholder content (`api-saving-and-getting-data.md` is rewritten from scratch) |

## Design tenets

1. **Prose here, specs there.** Technically specific content — CLI flags, env vars, endpoint paths, field names, error codes, helm values — is ingested from cyoda-go at build time, not retyped. Prose explains *why, when, how to think about*.
2. **Version-agnostic by default.** Pages that must describe version-specific behavior carry `stability: evolving | awaiting-upstream` frontmatter and a visible banner.
3. **Digital twins drive the IA.** App development is one section (Build, tier-agnostic) regardless of where it runs. Ops splits by deployment mode.
4. **Delegation over duplication.** Where a canonical source exists (or should), ingest it. Where it doesn't yet, vendor a local copy and file an upstream issue.
5. **Discoverable for humans and AI.** Every page advertises its markdown sibling; `/llms.txt` and `/llms-full.txt` are published and linked from every page head.

## Information architecture

### Top-level sidebar

```
Getting Started
Concepts
Build
Run
Reference
```

Today's JSON Schemas top-level entry moves inside Reference. `Architecture`, `Guides`, `Cloud Info` disappear as top-level sections.

### Getting Started (1–2 pages)

```
getting-started/
  install-and-first-entity.mdx     — single onramp: install cyoda-go (SQLite default),
                                      create your first entity, trigger a workflow.
                                      In-memory mode called out as the functional-test harness.
```

### Concepts (7 pages — the heart of the site)

Version-agnostic. This is where docs.cyoda.net does its most distinctive writing.

```
concepts/
  what-is-cyoda.md                 — EDBMS framing, positioning
  entities-and-lifecycle.md        — entity model, states, history, temporal queries
  workflows-and-events.md          — state machines, triggers, external processors, audit trail
  digital-twins-and-growth-path.md — the four tiers, why the app is the same everywhere
  apis-and-surfaces.md             — REST vs gRPC vs Trino: when and why.
                                      Includes the preference for gRPC in compute nodes
                                      (audit hygiene, simplified authorization).
  authentication-and-identity.md   — conceptual token flows (OAuth2, M2M, on-behalf-of, external key trust).
                                      Operator-side config links to cyoda-go for self-hosted tiers.
  design-principles.md             — from current `guides/cyoda-design-principles.mdx`
```

### Build (6 pages — patterns for app developers; tier-agnostic)

```
build/
  overview.mdx                     — the shape of a Cyoda app; where Build stops and Run begins
  modeling-entities.md             — schema discovery, evolution, validation *thinking*
  working-with-entities.md         — NEW (rewrite of api-saving-and-getting-data).
                                      End-to-end CRUD + search via the API using cyoda-go.
                                      No videos. Prose + minimal worked examples.
  workflows-and-processors.md      — state-machine design, when to externalize compute;
                                      uses gRPC; links to Reference for protocol detail
  client-compute-nodes.md          — pattern for processor + criteria services;
                                      from current `guides/client-calculation-member-guide.md`
  testing-with-digital-twins.md    — in-memory harness philosophy;
                                      simulation at volumes exceeding production
```

Working code examples are referenced in `cyoda-go/examples/` rather than reproduced inline.

### Run (4 top-level pages + cloud sub-tree — deployment shapes)

```
run/
  overview.mdx                     — the packaging ladder (desktop → docker → kubernetes → cyoda-cloud)
                                      with a tier-to-packaging matrix
  desktop.md                       — single binary for dev and low-volume production;
                                      covers both in-memory and SQLite modes of the binary.
                                      *What and when*; the *how* (install, CLI flags)
                                      delegates to Reference/cli + Reference/configuration.
  docker.md                        — bespoke integration composition; links to
                                      `cyoda-go/examples/compose-with-observability`
  kubernetes.md                    — Helm deployment shape, HA architecture (active-active
                                      stateless behind LB), PostgreSQL tier.
                                      Helm values delegate to Reference/helm.
  cyoda-cloud/
    overview.md                    — hosted Cassandra offering; STATUS: test/demo only,
                                      use at own risk, commercial SLA coming.
                                      Absorbs today's architecture + service-details.
    provisioning.md                — from current `guides/provision-environment.mdx`
    identity-and-entitlements.md   — merged from current `cloud/entitlements.md`,
                                      `guides/iam-jwt-keys-and-oidc.md`,
                                      `guides/iam-oidc-and-jwt-claims.md`
    status-and-roadmap.md          — merged from current `cloud/status.md`, `cloud/roadmap.md`
```

Self-hosted identity mechanics (OIDC config, signing key rotation, M2M credentials for the operator's own instance) are **not** duplicated per packaging mode. cyoda-go is the canonical source; each packaging page cross-links to the cyoda-go docs on identity and covers only the *deployment-mode glue* specific to that packaging.

### Reference (6 pages — thin, mostly ingest or placeholder)

```
reference/
  index.mdx                        — directory: what lives here, what's sourced from cyoda-go
  api.mdx                          — REST (Scalar/Stoplight iframe, as today) +
                                      gRPC rendered from proto when available upstream
  schemas.mdx                      — existing auto-generated JSON Schemas tree,
                                      moved in as-is from current top-level sidebar
  cli.mdx                          — ingests `cyoda --help` tree.
                                      PLACEHOLDER today → upstream issue filed
  configuration.mdx                — ingests env vars + config doc.
                                      PLACEHOLDER today → upstream issue filed
  helm.mdx                         — ingests helm-docs output.
                                      PLACEHOLDER today → upstream issue filed
```

Every page in Reference either embeds/ingests generated content or is a clearly labelled placeholder with a GitHub issue reference. Prose in Reference is limited to page-level orientation.

## Delegation model

### Per-page frontmatter (source-of-truth metadata)

Any page that renders ingested content carries:

```yaml
source:
  repo: cyoda-platform/cyoda-go
  path: docs/environment.md
  vendored_at: <commit-sha>
stability: stable | evolving | awaiting-upstream
```

Pages rendering ingested content render a visible banner: *"This page is sourced from cyoda-go. Edit upstream."*

### Vendor-mode plumbing

A new build script `scripts/sync-vendored.mjs` materialises vendored artefacts from one of three sources, controlled by a `VENDOR_MODE` environment variable:

- `VENDOR_MODE=local` — read from checked-in copies under `vendored/` (today's default)
- `VENDOR_MODE=release` — fetch from a pinned cyoda-go GitHub release artifact (future)
- `VENDOR_MODE=url` — fetch from arbitrary URLs per-source (CI / preview builds)

The existing generators (`scripts/generate-schema-pages.js`, `scripts/export-markdown.js`, `scripts/generate-llms-txt.js`) run after `sync-vendored.mjs` and consume from whichever sync target is in place. Switching to upstream delegation becomes a config change, not a content migration.

### Current vendored artefacts (bootstrap the model)

Checked in as vendored copies today, delegated later:

- `src/schemas/**` — JSON Schemas (currently in repo; will move to `vendored/schemas/` and be sourced from cyoda-go or a new sibling repo)
- `dist/openapi/openapi.json` — OpenAPI spec (same pattern)

Awaiting upstream (placeholder pages today, upstream issues filed):

- CLI help dump
- Environment variables documentation
- Helm values documentation
- gRPC proto → rendered reference
- Error code catalog (nice-to-have)

## Migration mapping

### Moves and merges

| Current path | New path | Treatment |
|---|---|---|
| `getting-started/introduction.md` | `concepts/what-is-cyoda.md` | Rewrite, shorter |
| `getting-started/quickstart.md` | `getting-started/install-and-first-entity.mdx` | Rewrite around cyoda-go local onramp |
| `guides/cyoda-design-principles.mdx` | `concepts/design-principles.md` | Move |
| `guides/api-saving-and-getting-data.md` | `build/working-with-entities.md` | **Delete old, write new from scratch.** Videos dropped. Redirect preserves URL. |
| `guides/authentication-authorization.md` | `concepts/authentication-and-identity.md` | Rewrite as conceptual |
| `guides/iam-jwt-keys-and-oidc.md` | `run/cyoda-cloud/identity-and-entitlements.md` | Merge |
| `guides/iam-oidc-and-jwt-claims.md` | `run/cyoda-cloud/identity-and-entitlements.md` | Merge |
| `guides/workflow-config-guide.mdx` | `build/workflows-and-processors.md` | Trim; specifics delegated |
| `guides/client-calculation-member-guide.md` | `build/client-compute-nodes.md` | Move, trim |
| `guides/entity-model-simple-view-specification.md` | split: `concepts/entities-and-lifecycle.md` (concept), spec delegated | Split |
| `guides/sql-and-trino.md` | split: `concepts/apis-and-surfaces.md` (decision), Reference (spec) | Split |
| `guides/provision-environment.mdx` | `run/cyoda-cloud/provisioning.md` | Move |
| `architecture/cyoda-cloud-architecture.md` | `run/cyoda-cloud/overview.md` | Move, absorb service-details |
| `cloud/entitlements.md` | `run/cyoda-cloud/identity-and-entitlements.md` | Merge |
| `cloud/roadmap.md` | `run/cyoda-cloud/status-and-roadmap.md` | Merge |
| `cloud/service-details.mdx` | `run/cyoda-cloud/overview.md` | Merge |
| `cloud/status.md` | `run/cyoda-cloud/status-and-roadmap.md` | Merge |
| `schemas/**` (generated) | `reference/schemas/**` | Generator output path updated |

### New pages from scratch

- `concepts/digital-twins-and-growth-path.md`
- `concepts/workflows-and-events.md`
- `concepts/apis-and-surfaces.md`
- `build/overview.mdx`
- `build/modeling-entities.md`
- `build/working-with-entities.md` (rewrite of deleted placeholder)
- `build/testing-with-digital-twins.md`
- `run/overview.mdx`
- `run/desktop.md`
- `run/docker.md`
- `run/kubernetes.md`
- `reference/index.mdx`
- `reference/cli.mdx` (placeholder)
- `reference/configuration.mdx` (placeholder)
- `reference/helm.mdx` (placeholder)
- `reference/api.mdx` (embed wrapper)

### Sidebar configuration

`astro.config.mjs` sidebar array replaced with five entries: Getting Started, Concepts, Build, Run, Reference. Each autogenerates from its directory.

### Redirects

Every current URL that changes gets a server-side redirect to its new path. A complete redirect map is derived mechanically from the migration mapping table above. Existing iframe routes (`/api-reference-scalar/`, `/api-reference-stoplight/`) stay.

## Discoverability (Tier A — included in this pivot)

1. **`<link rel="alternate" type="text/markdown" href="/markdown/<slug>.md">`** in `src/components/Head.astro` for every page.
2. **`/llms-full.txt`** — concatenated full content. New script or extension of `scripts/generate-llms-txt.js`. Runs after `export-markdown.js`.
3. **Head-level `<link rel="alternate">` for `/llms.txt` and `/llms-full.txt`** on every page.
4. **Visible "View as Markdown" link** in `src/components/TableOfContents.astro` next to the existing "Copy page" button.
5. **Sitemap includes `.md` URLs** — parallel `sitemap-markdown.xml` or extension of the default sitemap output.
6. **JSON-LD `TechnicalArticle`** in `Head.astro`: `headline`, `description`, `dateModified`, `inLanguage`, `isPartOf`.
7. **robots.txt** explicitly allows common AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).

Light Playwright coverage added: head tags emitted on representative pages; `.md` endpoint resolves 200.

## Upstream asks (cyoda-go issues to file)

Tracked in the implementation plan; each becomes a GitHub issue on `cyoda-platform/cyoda-go` (or sibling repo where appropriate). Until fulfilled, cyoda-docs keeps vendored placeholders with a banner referencing the issue.

1. **CLI help dump as a release artefact.** Canonical machine-readable (or markdown) output of `cyoda --help` and all subcommand helps, published per release. Candidate: `make docs/cli.md` target that writes a concatenated markdown tree.
2. **Canonical environment variables documentation.** A single file in cyoda-go (e.g., `docs/environment.md`), maintained as the authoritative source. Ideally generated from struct tags or a schema so it cannot drift from code.
3. **OpenAPI JSON as a release artefact.** Published with each cyoda-go release, not only via cyoda-docs. Enables `VENDOR_MODE=release` consumption.
4. **Helm values documentation via `helm-docs`.** Annotate `deploy/helm` chart and publish the generated values table per release.
5. **gRPC proto reference.** Render cyoda-go `proto/` as a consumable markdown/HTML reference; publish per release.
6. **(Nice-to-have)** Canonical error code catalogue.

## Deferred — separate GitHub issue

Filed against cyoda-docs (or a new sibling repo) as a **follow-up issue**, not blocking this pivot:

- **MCP docs server** — companion service exposing cyoda-docs as MCP tools (`search_docs`, `get_page`, `list_sections`) for Claude Code / Cursor / VS Code / etc. Reads `/llms-full.txt` and the schemas. Likely a Cloudflare Worker or small standalone service.
- **Stretch goal on that same issue:** Cloudflare Pages edge function for content negotiation (`Accept: text/markdown` on the same URL returns markdown instead of HTML).

## Open questions (resolve post-pivot, not blocking)

1. **Versioning strategy for the site itself.** Versioned URLs (`/v0.2/…`) vs. latest-only with release notes vs. per-page version badges. Whichever we pick must be compatible with the delegation model (vendored artefacts versioned per release). Separate design spec.
2. **Examples repository home.** Whether `cyoda-go/examples/` is the canonical home for worked code, or whether a separate `cyoda-examples` repo is warranted as the library grows.
3. **Self-hosted IAM page scope.** If cyoda-go's own identity docs prove insufficient for operators, we may need a thin `run/self-hosted-identity.md` summarising the deployment-mode concerns. Revisit once cyoda-go's docs land.

## Constraints and non-goals

- No exposure of `cyoda-go-cassandra` internals. Cassandra-tier content is limited to user-facing behaviour of the existing Cyoda Cloud offering.
- No duplication of `cyoda-go` README or architecture material in cyoda-docs.
- No new long-form prose describing parameter tables, flag lists, env var lists, endpoint schemas, or helm values. These are ingested.
- No changes to the Starlight theme, component overrides, or Cookie Consent / Analytics behaviour beyond what Head/TableOfContents require for discoverability.
