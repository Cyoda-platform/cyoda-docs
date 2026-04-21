---
title: "APIs and surfaces"
description: "REST, gRPC, and Trino SQL — when and why to use each."
sidebar:
  order: 40
---

Cyoda exposes three distinct API surfaces. Picking the right one for the job
matters; the surfaces are not equivalent, and each carries different guarantees.

## Three surfaces

- **REST** — the default surface for user-facing clients and administrative
  operations. CRUD over entities, search, workflow invocations, schema
  management, dashboards.
- **gRPC** — the surface for compute. External processors and criteria
  services connect to the platform over gRPC, receive work, and return
  results. Supports bidirectional streaming.
- **Trino SQL** — the surface for analytics. Cross-entity queries, reporting,
  JDBC connections, BI tools. Queries run against a Trino catalogue that
  projects entities into virtual SQL tables.

## REST: humans and services that speak to the platform

Use REST when the call represents *a user or service interacting with the
platform as a whole*: creating an order, searching for customers, reading
audit history, managing a workflow definition. This is the surface your
front-end, your admin tooling, and most external integrations will use.

REST is synchronous, authenticated with OAuth 2.0 bearer tokens, and
versioned. The full endpoint catalogue lives in the
[API reference](/reference/api/).

## gRPC: external processors that speak for the platform

Use gRPC when your code is *a compute node acting on behalf of a workflow
transition*. Processors and criteria attached to a transition call out to
external services over gRPC; those services stream work units back to the
platform.

**Prefer gRPC for compute** over implementing processors as REST callbacks.
Three reasons:

1. **Audit hygiene.** Every gRPC call is recorded against the transition that
   invoked it, inside the platform's audit trail. REST callouts cannot
   reconstruct that association reliably.
2. **Authorization is simpler.** The platform brokers the identity and scopes
   passed to the compute node; you don't have to manage credentials between
   the platform and your processor independently.
3. **Bidirectional streaming.** High-throughput ingest and transformation
   workloads benefit from streaming both ways; REST cannot.

For how to implement a compute node, see
[Build → client compute nodes](/build/client-compute-nodes/).

## Trino SQL: cross-entity analytics

Use Trino when the question is *analytical* — joins across entity types,
aggregates, reporting, time-series. Every entity model is projected into a
set of virtual SQL tables; nested arrays and objects expand into separate
tables so relational queries remain natural.

Typical uses:

- Ad-hoc analysis against live data in a notebook or BI tool.
- Scheduled reports that aggregate entities across a tenant.
- Historical queries using the `point_time` column for as-of reads.

The table generation rules, data-type mappings, JDBC connection patterns,
and handling of polymorphic fields are in the
[Trino SQL reference](/reference/trino/). For the Build-side quickstart —
connection recipe, first query, performance notes — see
[Analytics with SQL](/build/analytics-with-sql/).

## Which surface, when?

- Building a UI, an admin tool, or a sync integration? **REST.**
- Writing a processor or criterion that runs against transitions? **gRPC.**
- Running analytics, reports, or ad-hoc queries across many entities?
  **Trino SQL.**

All three surfaces are backed by the same entity store. A transition recorded
via REST is visible to gRPC compute nodes and queryable through Trino, with
the same audit trail behind it.
