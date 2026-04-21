---
title: "Workflows and events"
description: "State machines as a first-class concept — triggers, external processors, and audit trails."
sidebar:
  order: 20
---

A **workflow** is the state machine an entity lives inside. It declares the
states an entity can be in, the transitions between them, the criteria that
gate whether a transition is allowed, and the processors that run along the
way. This page explains the concept; the
[Build guide for workflows and processors](/build/workflows-and-processors/)
covers how to configure one.

## State machines define allowed change

Every entity type has a workflow. Nothing changes the entity except a
transition defined in that workflow. A transition is atomic: it produces a new,
durable revision of the entity, runs any attached processors under the
platform's event contract, and either succeeds or has no effect.

Workflows are general state machines, not pipelines. Transitions can be
automatic (fire as soon as their source state is entered and any criteria are
satisfied) or manual (fire only when invoked by an actor). A workflow can
contain cycles, branches, and multiple terminal-looking states that are
actually re-entered later — it does not need to terminate at all.

## Triggers

Transitions fire in response to events. The shape of the event determines how
the transition is triggered:

- **Manual** — an actor (a user, a service, an admin) calls the transition by
  name through the API.
- **Time-based** — schedules or delays expressed in the workflow; the platform
  fires the transition when the clock reaches the configured point.
- **Message-based** — an incoming message (an ingest event, an upstream
  notification) drives the transition.
- **Automatic** — on entering a state, the first valid auto transition fires
  within the same transaction, recursing until no further auto transition
  applies.

## Processors

A **processor** is code that runs as part of a transition. It can read the
entity, compute a new field, call an external service, persist a side effect,
or reject the transition.

Two flavours:

- **Internal processors** — shipped with the platform for common work
  (validation, projection, enrichment) and invoked declaratively.
- **External processors** — your code, hosted anywhere, called by Cyoda over
  gRPC. External processors preserve audit hygiene (every call is logged
  against the transition), keep authorization simple (the platform brokers
  identity), and support bidirectional streaming for high-throughput
  workloads. For why gRPC is preferred and how to implement one, see
  [Build → client compute nodes](/build/client-compute-nodes/).

Processors can run synchronously within the transition's transaction, or
asynchronously alongside it.

## Audit trail is the storage model

Because every transition produces a revision and every processor invocation is
recorded against it, the audit trail is not a separate log — it is a view of
the storage. You can query the transitions an entity has been through, the
criteria that were evaluated, the processors that ran, and the inputs and
outputs of each. Point-in-time queries use the same index.

## Why this matters

State machines plus durable transitions plus a queryable audit trail are the
native ingredients for **regulated**, **auditable**, and **replayable**
systems. Replaying a workflow from history does not require an event-sourcing
framework on the side — it is the default behavior of the store.

## Where to go next

- [Entities and lifecycle](/concepts/entities-and-lifecycle/) — the entity
  side of the machine, with a state-machine diagram.
- [Build → workflows and processors](/build/workflows-and-processors/) — how
  to declare a workflow in practice.
- [Build → client compute nodes](/build/client-compute-nodes/) — how to
  implement an external processor over gRPC.
