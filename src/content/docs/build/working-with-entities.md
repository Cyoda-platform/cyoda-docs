---
title: "Working with entities"
description: "Create, read, update, and search entities via the cyoda-go API — worked examples."
sidebar:
  order: 20
---

This page shows the patterns for interacting with entities through the
platform API. Examples assume a local cyoda-go instance running on the default
port with SQLite persistence; the same requests work against Cyoda Cloud with
the cloud endpoint and an issued token.

The complete endpoint catalogue — parameters, response shapes, error codes —
lives in the [API reference](/reference/api/). Keep that open as you work.

## The shape of the API

Cyoda speaks REST for CRUD, search, and workflow invocation, gRPC for external
processors, and Trino SQL for analytics. This page covers REST; see
[Build → client compute nodes](/build/client-compute-nodes/) for gRPC and the
[APIs and surfaces](/concepts/apis-and-surfaces/) overview for the decision
framework.

Every request is authenticated with a bearer token. Every response includes
the entity's current revision, state, and timestamps.

## Create

Post an entity to its model. The first time you post, Cyoda discovers the
schema from what you send:

```bash
curl -X POST http://localhost:8080/api/models/orders/entities \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orderId": "ORD-42",
    "customerId": "CUST-7",
    "amount": 120.00,
    "currency": "EUR",
    "lines": [
      { "sku": "AX-1", "qty": 2, "price": 60.00 }
    ]
  }'
```

The response carries the entity's id, current state, and the revision number.

## Read

Fetch the current revision by id:

```bash
curl http://localhost:8080/api/models/orders/entities/ORD-42 \
  -H "Authorization: Bearer $TOKEN"
```

List with a filter — a short equality query returns the matching set:

```
GET /api/models/orders/entities?state=submitted&customerId=CUST-7
```

For anything beyond a bounded lookup — result caps, pagination,
predicates, historical reads — see [searching entities](/build/searching-entities/).

## Update

Direct field updates go through `PATCH`:

```
PATCH /api/models/orders/entities/ORD-42
```

However, **mutations that move the entity between lifecycle states should go
through a transition**, not a patch. Invoking the `submit` transition records
it in the audit trail and runs any attached processors:

```
POST /api/models/orders/entities/ORD-42/transitions/submit
```

See [Build → workflows and processors](/build/workflows-and-processors/) for
how to declare transitions.

## Search

Cyoda supports two query modes:

- **Immediate** (API term: `direct`) — synchronous, returns right
  away. Good for UI lookups and short operations. Result size is
  capped, so `direct` is best for queries that produce a bounded,
  small result set.
- **Background** (API term: `async`) — queued as a job, returns a
  handle you can poll. Result size is unbounded; results are paged.
  Good for large result sets, periodic reports, and exports. On the
  Cassandra-backed tier (Cyoda Cloud, or a licensed Enterprise
  install), `async` search runs distributed across the cluster and
  scales horizontally: query throughput for a fixed shape grows
  roughly linearly with the number of nodes.

Both accept the same filter grammar over entity fields, metadata, and
workflow state. Pick immediate by default; switch to background when a
query would hit the `direct` result cap, would time out, or would hold
resources you need elsewhere. For predicates, pagination, and worked
examples, see [searching entities](/build/searching-entities/).

## Temporal queries

Every entity's history is queryable. Add a `pointInTime` parameter to any read
or search request to retrieve the world as of that timestamp:

```
GET /api/models/orders/entities/ORD-42?pointInTime=2026-03-01T00:00:00Z
```

This is the primary way to answer regulatory and audit questions: *what did
this customer's balance look like at quarter close?* For the same
parameter applied to searches, see
[searching entities → historical reads](/build/searching-entities/#historical-reads-with-pointintime);
for analytical reads expressed as SQL, see
[analytics with SQL](/build/analytics-with-sql/).

## From a compute node

When your code is reacting to a transition — running a processor or
evaluating a criterion — talk to the platform over **gRPC**, not REST. The
gRPC path preserves the audit association between the transition and the
compute call, brokers identity, and supports streaming. See
[Build → client compute nodes](/build/client-compute-nodes/) for the
implementation pattern.
