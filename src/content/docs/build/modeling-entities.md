---
title: "Modeling entities"
description: "Design patterns for entity schemas — boundaries, evolution, and validation."
sidebar:
  order: 10
---

Modeling well in Cyoda comes down to drawing the right boundaries between
entities, letting the schema grow with the data, and treating validation as
the job of the platform rather than the application layer. This page covers
the patterns worth knowing before you ship a first model.

## One entity per noun

The simplest rule: every domain noun that has an independent lifecycle is its
own entity. An `Order` has its own states, its own history, and its own audit
trail; so does a `Customer`. They relate via references, not by embedding.

A useful test: *does this thing change on its own clock?* If yes, it's an
entity. Line items on an order often do not — they live inside the order's
state transitions — so they stay embedded. Fulfilment events on an order do —
they have their own lifecycle — so they become their own entity, referenced
by the order.

## Let the schema discover itself

Cyoda auto-discovers schemas from the data you send. For a new model you do
not write a schema file; you post a representative sample (or a batch of
them) and Cyoda records the fields, their types, and their nested shapes.
New samples widen the schema: a field seen as `INTEGER` once and as
`[INTEGER, STRING]` later becomes a polymorphic field, and arrays grow to
accommodate observed widths.

This lets you start loose, iterate with real data, then **lock** the model
when the shape is stable. After locking, incoming entities that don't match
the current schema are rejected.

## Evolving a model

Three things you can do without surprise:

- **Add fields.** New fields appear in the next sample you send.
- **Widen types.** Cyoda handles polymorphic fields via a type hierarchy
  (e.g. `BYTE → SHORT → INT → LONG`; `FLOAT → DOUBLE → BIG_DECIMAL`).
- **Lock.** Freeze evolution once the shape is stable; useful before
  onboarding external clients against the schema.

Two things to treat carefully:

- **Renames.** Cyoda does not rename a field for you; if you rename in the
  source, you get a new field alongside the old one. Plan the migration of
  existing data explicitly.
- **Narrowing types.** Once the schema has observed `STRING` in a field,
  you cannot later restrict it to `INTEGER` without migrating.

## Who validates what

Cyoda validates **structure** and **types** against the model: required
shapes, element types, array constraints, polymorphic compatibility. That is
free; you do not write those validators.

Your application is responsible for **semantic** validation that lives inside
transitions: "the order total must equal the sum of line items", "the
payment currency must match the customer's currency". Those belong in
workflow criteria and processors where they can fail a transition and leave
the old revision intact.

## Anti-patterns

- **The god-entity.** One model that tries to represent everything. Split it
  along lifecycle boundaries; lifecycles that evolve independently want
  separate entities.
- **Premature generalisation.** A model that tries to anticipate every future
  field. Let the schema discover itself and lock when you are ready.
- **Shadow workflows.** Implementing state transitions as boolean flags on
  the entity. Put states in a workflow; that's what workflows are for.

## Where to go next

- [Entities and lifecycle](/concepts/entities-and-lifecycle/) — the
  conceptual model behind an entity.
- [Entity model export](/reference/entity-model-export/) — the wire
  format of a SIMPLE_VIEW export, node descriptors, type descriptors,
  and the JSON Schema for the response.
- [JSON schema reference](/reference/schemas/) — the REST-API message
  schemas generated from cyoda-go.
- [Workflows and events](/concepts/workflows-and-events/) — how state
  and transitions are configured.
