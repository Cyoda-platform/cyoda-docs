# Cyoda Application Architecture

At the heart of Cyoda is the Entity Database Management System (EDBMS). This system is built around the concept of entities as finit state machines governed by workflows, and are the core building blocks of any Cyoda application.

## TL;DR - Core Principles of the Cyoda EDBMS

- All persisted data is an **_Entity_**.
- The _Entity_ data model is tree-like.
- Each _Entity_'s is always associated with a data model which is known.
- _Entities_ hold structured information and a **_State_**.
- _Entity_ **Lifecycle** is governed by **_Workflow_**.
- _Entity_ mutations require a specific state **_Transition_**.
- _Transitions_ are guarded by **_Criteria_** and may be **automated** or **manual**.
- Upon entering a _State_, the first valid automated transition is applied immediately and within the same **_Transaction_**.
- The process **recurses** until no further automated _Transitions_ are eligible, reaching a **stable state**.
- **_Processes_** can be attached to _Transitions_ which are executed upon traversal to the next _State_.
- _Processes_ can be **synchronous** or **asynchronous**.
- _Processes_ can be executed in the **same** _Transaction_ as the _Transition_ or in a **separate** _Transaction_.

## What Is an Entity?

At the heart of Cyoda's architecture is the _Entity_: a domain object that represents a real-world "thing" with evolving state over time — such as a customer, an order, or even a message.

**Key principles of entities:**
- **Persistent**: An entity has a life span. It exists independently of transient system behavior.
- **Structured State**: It evolves through a defined set of states.
- **Contextualized**: Its current state reflects its full operational context.

In Cyoda, **every problem is approached as an entity problem**, meaning the system's purpose is to create, observe, evolve, and act upon entities in meaningful ways.

## The Key Role of the Entity in Cyoda

Cyoda is not just a data platform — it's a **processing platform**. Entities serve as the unifying structure for:

- **Data**: facts about the world
- **State**: where things stand now
- **Behavior**: how things change

This approach allows Cyoda systems to be:
- **Decoupled**: Business logic is localized within entities
- **Composable**: Entities can reference or trigger one another
- **Auditable**: Every state change is captured and traceable

## What Is a Workflow?

A **workflow** is the behavioral model of an entity, often represented as a **finite-state machine (FSM)**. It defines:

- **States**: Possible statuses of the entity
- **Transitions**: Changes from one state to another
- **Triggers and Processes**: Events causing transitions, and logic that runs during them

Workflows define **how business logic unfolds over time** in a structured, visual, and deterministic way.

## Role of Event-Driven Architecture

In Cyoda’s event-driven model:
- **Events** (e.g. "document uploaded") trigger entity transitions
- Transitions invoke **processes** (e.g. business rules, messaging)
- Everything is tied together via the entity’s *Workflow*

**Advantages:**
- **Loose coupling**
- **Responsiveness**
- **Scalability**

## Putting It All Together in Cyoda

The Cyoda method:
- Model your domain as an **entity**
- Define its behavior in a **workflow**
- Let **events** drive change
- Store everything in the **entity database** — data, state, and process

## Guiding Practices
- Always think in terms of **stateful entities**
- Prefer **FSM workflows** over procedural code
- Use **event triggers** for process logic
- Keep **rules** close to the entity
- **Visualize workflows** for stakeholder alignment


## Recommended Reading

- this documentation site
- https://medium.com/@paul_42036/entity-workflows-for-event-driven-architectures-4d491cf898a5
- https://medium.com/@paul_42036/whats-an-entity-database-11f8538b631a