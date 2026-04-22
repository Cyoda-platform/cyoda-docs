---
title: "Searching entities"
description: "Query sets of entities over REST — direct vs async modes, predicates, pagination, and historical reads."
sidebar:
  order: 25
---

Cyoda exposes search over REST for any query that returns a set of
entities. Use it when you need more than one entity back, when the filter
goes beyond a single id lookup, or when you want to scope by workflow
state. For single-entity reads, stay on the CRUD endpoints in
[working with entities](/build/working-with-entities/); for cross-entity
analytics, use [SQL](/build/analytics-with-sql/); for event-driven
compute, use [gRPC compute nodes](/build/client-compute-nodes/).

## Two query modes

Cyoda splits search into **Immediate** and **Background** modes. Pick by
expected result size and urgency; the filter grammar is identical.

- **Immediate** (API term: `direct`) — synchronous. The request returns
  matching entities in the response body. Result size is **capped**, so
  `direct` is the right default only when you know the filter produces
  a bounded, small set: a UI list, a lookup, a small report. If a
  query hits the cap, switch it to `async`.
- **Background** (API term: `async`) — queued. The request returns a
  job handle; poll it to retrieve results. Result size is **unbounded**
  and results are **paged**. On the Cassandra-backed tier (Cyoda Cloud,
  or a licensed Enterprise install), `async` runs distributed across
  the cluster: for a fixed query shape, throughput scales roughly
  linearly with the number of nodes.

The decision tree is short:

- Small bounded result, UI-facing → `direct`.
- Might be large, can tolerate a second or two of queuing, exports,
  reports, batch jobs → `async`.
- Hitting the cap or the request timeout on `direct` → `async`.

## A direct search

Filter by a combination of entity fields and workflow state:

```bash
curl -X POST http://localhost:8080/api/models/orders/search \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mode": "direct",
    "filter": {
      "state": "submitted",
      "customerId": "CUST-7"
    }
  }'
```

The response is the list of matching entities, each with its current
state, revision, and timestamps.

## An async search

Submit the search and capture the handle:

```bash
curl -X POST http://localhost:8080/api/models/orders/search \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mode": "async",
    "filter": { "state": "submitted" },
    "pageSize": 1000
  }'
```

Poll the returned `searchId` until the job is ready, then fetch pages:

```
GET /api/search/{searchId}/status
GET /api/search/{searchId}/results?page=0
GET /api/search/{searchId}/results?page=1
```

A single `searchId` can be paged repeatedly until the result is
expired; expiry is controlled per deployment.

## Filter shape

The filter is a JSON document whose fields are entity field paths,
metadata (`state`, `createdAt`, …), or workflow labels. The authoritative
operator grammar — equality, comparisons, ranges, set membership, AND/OR
combinators, nested-field access — lives in the
[REST API reference](/reference/api/). The shape used in the simple
examples above (flat field→value map) is the equality short form; use
the full object form when you need operators:

```json
{
  "and": [
    { "field": "state", "eq": "submitted" },
    { "field": "amount", "gte": 1000 }
  ]
}
```

Treat the reference as the source of truth for the exact operator names
and nesting rules; Cyoda's REST spec is published as an OpenAPI asset
against each release, see
[`cyoda-go#81`](https://github.com/Cyoda-platform/cyoda-go/issues/81).

## Historical reads with `pointTime`

Every search accepts a `pointTime` parameter to run against the world
as it existed at a given timestamp. The result is the set of entities
that would have matched, using the revision active at that time.

```bash
curl -X POST http://localhost:8080/api/models/orders/search \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mode": "direct",
    "pointTime": "2026-03-01T00:00:00Z",
    "filter": { "state": "submitted", "customerId": "CUST-7" }
  }'
```

This is the primary way to answer audit and regulatory questions from
REST — *what did this customer's open orders look like at quarter
close?* For the same question expressed as SQL, see
[`point_time` in analytics](/build/analytics-with-sql/).

## Paging and sort (async)

- `pageSize` is set at submission time; `page` is zero-indexed at read
  time.
- Sort keys go in the submission body; the reference lists the
  permitted keys per model.
- A completed `searchId` is stable for its retention window — page
  reads are idempotent.

## Performance notes

- Scope by `state` or a high-selectivity field first — the workflow
  state is indexed on every entity and is almost always the right
  first predicate.
- Prefer `async` as soon as the result set might be thousands of
  entities; the distributed execution on the Cassandra tier makes it
  cheaper per entity than a series of `direct` pages.
- Avoid open-ended `pointTime` scans across every revision — anchor
  the query at a specific timestamp or a short window.

## Where to go next

- [REST API reference](/reference/api/) — authoritative search payload
  schema, operator grammar, status and result endpoints.
- [Working with entities](/build/working-with-entities/) — single-entity
  CRUD and transitions; the CRUD page for reference on the same
  surface.
- [Analytics with SQL](/build/analytics-with-sql/) — heavy analytical
  work, cross-entity joins, historical scans via `point_time`.
- [Entities and lifecycle](/concepts/entities-and-lifecycle/) — the
  audit/history model behind `pointTime`.
