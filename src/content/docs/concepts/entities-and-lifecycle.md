---
title: "Entities and lifecycle"
description: "Entities as first-class citizens — schemas, states, history, and temporal queries."
sidebar:
  order: 10
---

In Cyoda, an **entity** is the unit of state: a JSON document that belongs to a typed
model, has a current lifecycle state, and carries a complete audit trail of every
change it has ever undergone. Entities are not rows to be updated in place — each
transition produces a new, durable revision, and history is a first-class query surface.

## Schema

Every entity belongs to a named **model** identified by `modelName` and `modelVersion`.
Cyoda auto-discovers the model schema from ingested samples rather than requiring it
up front: as records flow in, Cyoda observes the fields that appear, the types they
take, and the shape of nested arrays and objects. That observed shape is the schema.

Models evolve by merging. New fields are added, types widen when a field is seen with
more than one kind of value (e.g. `INTEGER` becoming `[INTEGER, STRING]`), and array
widths grow. The model can be **locked** when you want to freeze evolution — after
that, incoming data must validate against the current schema or be rejected.

The wire format and field conventions for exported models (type descriptors, array
representations, structural markers) are covered in the [schema reference](/reference/schemas/).

## Lifecycle

Entities move through **states** defined by a workflow — a state machine attached to
the model. A workflow declares the legal states, the transitions between them, and the
processors or criteria that run on each transition. Typical examples: an order moves
`draft → submitted → fulfilled → closed`; a document moves `ingested → validated →
indexed`.

Transitions are the atomic unit of change. Every transition is recorded, every
processor runs under the platform's event contract, and every resulting revision is
addressable. Workflow modeling — states, transitions, processors, criteria — is
covered in depth under [Workflows and events](/concepts/workflows-and-events/).

## History and temporal queries

Because transitions produce revisions rather than overwriting state, the full history
of an entity is always retrievable. You can ask:

- "What did this entity look like at timestamp T?" — point-in-time reconstruction.
- "What transitions has this entity been through, and when?" — transition log.
- "Which version of the model was this revision validated against?" — schema lineage.

This is not an add-on audit layer bolted onto a mutable store; it is the storage model.
See [History and audit](/concepts/history-and-audit/) for query patterns.

## Simple views

A **simple view** is a computed projection of a model — a flattened, machine-readable
description of the entity's observed shape, suitable for tools that need to generate
code, forms, or mappings from the schema. Simple views are exported via the model API
and re-imported without loss.

The full response format — node paths, type descriptors, uni- vs multi-type arrays,
structural markers — is specified in the [API reference](/reference/api/) and the
[schema reference](/reference/schemas/).
