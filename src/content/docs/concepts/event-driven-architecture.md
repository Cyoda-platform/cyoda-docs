---
layout: docs
title: "Event-Driven Architectures"
description: How Entity Workflows map to event-driven architectures
order: 2
eleventyNavigation:
  key: Event Driven Architecture
  parent: Concepts
  order: 2
---

A condensed version of the original article by Paul Schleger [Entity Workflows for Event-Driven Architectures](https://medium.com/@paul_42036/entity-workflows-for-event-driven-architectures-4d491cf898a5). 

## Overview

Entity workflows offer a practical abstraction for managing stateful, event-driven systems. This approach, grounded in
the declarative modeling of entities, states, and transitions, enables the development of highly composable and
traceable backends. By aligning software behavior with domain structure, developers gain clearer insight into system
dynamics while enabling automation, observability, and runtime governance.

The ideas outlined here form the architectural foundation of **Cyoda**, an event-driven entity and workflow platform for
mission-critical, cloud-native systems. It provides full traceability, runtime governance, and scalable state
management. Cyoda’s design enables AI developer assistants to interact more effectively with structured models. It also
allows AI agents to participate directly in backend processing through clearly defined workflows and processors.

## Motivation

Traditional backend services often conflate business logic with technical implementation concerns, leading to systems
that are difficult to understand, extend, or monitor. Entity workflows address these issues by introducing a formal
behavior model based on state transitions triggered by events and governed by declarative rules.

This model facilitates:

* **Modularity**: Each workflow localizes its transitions and logic.
* **Traceability**: All transitions reflect explicit, timestamped events.
* **Automation**: AI agents or rule engines can interpret and drive workflows.
* **Observability**: System behavior becomes queryable at the level of business entities.

Cyoda adopts this model natively. Every backend service in Cyoda operates within a defined entity and workflow context,
ensuring consistent behavior, visibility, and control across the entire platform.

## Core Concepts

### Entity

An entity encapsulates business-relevant state and identity. It may represent a user, an order, a device, or any other
domain object. In Cyoda, entities are first-class citizens, stored in an entity-native database and versioned over time.

### State

Each entity instance exists in a well-defined state at any point in time. States describe semantic phases in a
lifecycle (e.g., `PendingApproval`, `InReview`, `Completed`). Cyoda enforces state integrity and exposes current and
historical states as queryable API endpoints.

### Transition

A transition represents a permissible state change, triggered by an external or internal event. Transitions include:

* A source and target state
* A triggering event or condition
* Optional processors or validation functions
* Metadata for audit and governance

Transitions may be **manual**, requiring explicit user or API invocation, or **automated**, where the system evaluates
conditions and initiates the transition without direct external input. Automated transitions represent a key capability
in event-driven systems, enabling workflows to advance reactively based on internal state changes, timers, or derived
signals. This mechanism shifts the system from a pull-based control flow to a responsive, declarative model.

> **Image Placeholder**
> `![Entity workflow lifecycle](/images/entity_workflow_lifecycle.png)`

### Workflow

A workflow defines the allowed transitions for a given entity type. It captures the lifecycle as a finite state
machine (FSM) governed by events and rules. Cyoda provides runtime introspection and API-level discovery of these
workflows.

### Event

Events act as the catalysts for transitions. They may originate from external inputs saving an entity with a transition,
internal timers, or other entity transitions launching processors.

### Processor (Action)

Processors encapsulate the logic to be executed upon traversing a transition; they represent an *Action*. They may
enrich the entity, invoke external services, or enforce invariants. Cyoda supports asynchronous and synchronous
processors.

> **Image Placeholder**
> `![Workflow processing pipeline](/images/workflow_processor_pipeline.png)`

## Benefits for System Design

### Declarative and Discoverable

Entity workflows describe system behavior as structured data. This model lends itself to introspection, versioning, and
external tooling. Documentation, testing, and governance all benefit from this declarative nature.

### Time-Travel and Auditability

Each entity’s history exists as a verifiable sequence of entity changes via transitions (as a write-only event log for
that entity and its association with other entities participating in the corresponding transaction). Each entity can be
reconstructed to any state at a given point in time along its timeline history. This enables precise reconstruction of
past states, which supports regulatory requirements, debugging, and analytics.

### AI-Assisted Development

The structured nature of workflows allows AI systems to:

* Automatically generate backend service scaffolding.
* Validate the completeness and consistency of models.
* Implement logic within processors or criteria.

### Runtime Agility

Because transitions and workflows are data-driven, teams can evolve behavior at runtime without rebuilding the
application. This agility supports fast iteration, experimentation, and controlled rollout of new behavior.

## Event-Driven Architecture Alignment

Entity workflows integrate naturally into event-driven architectures (EDA). The structure assumes that state changes
result from discrete events, which are observable, timestamped, and externally triggered. This alignment manifests in
several key design advantages:

### Event as the Primary Driver

In this model, workflows do not poll or query for changes; they react to events pushed by upstream systems or emitted by
user interactions. Each event triggers the evaluation of transitions, creating a deterministic and traceable execution
path.

### Automated Transitions as a Core Mechanism

Automated transitions, which evaluate their triggering conditions based on the current state or context of an entity,
play a central role in realizing an event-driven architecture. Rather than requiring all progression to come from
external systems, workflows can express internal dependencies and conditional logic declaratively.

### Decoupling of Components

Events enable components to operate independently. Producers of events do not require knowledge of the consumers. This
decoupling simplifies the deployment, testing, and scaling of individual services. Entity workflows become the consumers
of domain events and apply business rules in response.

### Scalability Through Asynchronous Processing

Because each event can be processed independently, workflows can scale horizontally.

## Conclusion

Entity workflows offer a structured approach to building event-driven systems by making transitions, conditions, and
processing logic explicit. When an entity database supports concepts like processors, automated transitions, and
criteria as first-class elements, it begins to function not just as a store of state but also as a runtime for business
behavior.

This design encourages a shift in how developers model backend logic. Instead of orchestrating workflows through queues,
handlers, and distributed coordination code, developers can work with declarative models tied closely to domain
entities. The underlying system manages execution, state transitions, and consistency boundaries.

This results in systems that tend to be easier to inspect, test, and evolve. Business logic aligns more naturally with
the data it governs, and workflows become easier to trace and understand through versioned state machines. Investigating
behavior often reduces to inspecting an entity’s timeline rather than correlating logs across multiple services.

Cyoda applies these principles in practice. With appropriate infrastructure, the model scales from individual services
to larger platforms. The system handles both persistence and execution logic in a unified framework, enabling teams to
focus on domain-specific development rather than low-level plumbing.

This architectural structure also provides a foundation where AI-assisted development becomes more practical. The
alignment between system structure and domain semantics allows both human developers and AI tools to reason about
workflows, entities, and behavior more effectively.

For an in-depth explanation and additional context, refer to the original article by Paul Schleger: [Entity Workflows for Event-Driven Architectures](https://medium.com/@paul_42036/entity-workflows-for-event-driven-architectures-4d491cf898a5)