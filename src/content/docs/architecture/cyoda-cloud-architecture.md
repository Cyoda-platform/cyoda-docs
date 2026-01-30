---
title: "Cloud Architecture"
description: Physical architecture for Cyoda Cloud
---
This document describes the logical and physical architecture of Cyoda Cloud, with a focus on how client compute integrates with the platform. It is intended for software developers, solution architects, DevOps/SRE engineers, and autonomous agents that need a clear, implementation-oriented understanding of the system.

Where relevant, the accompanying diagrams illustrate alternative deployment and connectivity models rather than a single fixed topology.

# TL;DR

Cyoda models entities via configuration and provides persistence, transactional workflow orchestration and processing, and distributed querying via API and SQL in a write-only, horizontally distributed architecture. This enables building scalable event-driven systems with ease, with client-specific logic executed as independent compute.

![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-compact.svg)

Key points:
- Cyoda calls client compute via **gRPC + CloudEvents**
- Client compute is **client-owned**, **polyglot**, and **independently scalable**
- Data is stored in **Cassandra (bare metal, per-tenant keyspaces)**
- Data is **queried via HTTP API or Trino SQL**, in both cases as distributed queries with horizontally scalability
- Each cluster layer (Cyoda, Trino, client compute, Cassandra) **scales horizontally**; nothing is coupled


# Platform Overview

Cyoda Cloud is deployed on Hetzner bare‑metal infrastructure in Helsinki, Finland, supplemented by selected internal services running on Hetzner Cloud. Each lifecycle stage (development, staging, production) is deployed as an independent environment with its own Kubernetes and Cassandra clusters.

Key characteristics:
- **Bare metal first**: Cassandra runs directly on bare‑metal servers for predictable latency and I/O performance, and is intentionally not containerised.
- **High‑bandwidth internal network**: Bare‑metal nodes are connected via a private 10 Gbit LAN.
- **Strict network isolation**: External access is fronted by Cloudflare. All ingress to internal services occurs through VPN‑secured channels. 
- **Horizontal scalability by design**: Cyoda services, Trino, and client compute nodes scale independently.

## Client Compute Model

Cyoda delegates all client‑specific business logic to Client Compute Nodes. These nodes:
- Connect to Cyoda via gRPC and CloudEvents
- Execute processors within workflows
- Evaluate criteria that control gateway transitions
- Are fully owned and implemented by the client

Client compute is a first‑class part of the architecture and can be deployed flexibly depending on latency, isolation, and operational requirements.

Currently supported client runtimes:
- Java/Kotlin
- Python

Additional languages are planned, enabling a fully polyglot execution model.

## Developer Mode
In developer mode, client compute nodes typically run on the developer’s local machine.

![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-developer-mode.svg)

Characteristics:
- Client nodes connect to Cyoda Cloud via a **Cloudflare tunnel**
- Developers use their preferred IDE, language, and local tooling
- Hot‑reload and rapid iteration are supported

In this mode:
- **Client applications** interact with Cyoda using the HTTP API or the Trino JDBC driver to perform CRUD operations and queries
- **SQL tooling** can be used directly against entity data via Trino

Despite its simplicity, the architecture remains fully horizontally scalable:
- Cyoda services scale elastically per tenant
- Trino scales independently for analytical workloads
- Client compute nodes scale independently
- Cassandra scales horizontally and is shared across tenants

## Multi-Cloud
Cyoda supports multi‑cloud deployments where tenant resources run in a separate cloud or region from the Cyoda control plane.
![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-multi-cloud.svg)

## Multi Language
Each client compute node can be implemented in a different programming language.

This enables:
- Polyglot architectures
- Team autonomy
- Incremental migration between languages

Cyoda treats all client nodes uniformly at the protocol level, regardless of implementation language.

![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-multi-language.svg)

## Single-Cloud
An entire Cyoda instance (control plane and tenant workloads) can be deployed into a single cloud environment.

![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-single-cloud.svg)

## Sharded by Client Tag
For advanced workloads, client tags can be used to route events to specific subsets of client compute nodes.

This enables targeted execution strategies, such as:
- Separating GPU/TPU‑backed compute from CPU‑only workloads
- Isolating high‑throughput, low‑latency processing from batch workloads
- Running specialised processors with different cost or performance characteristics

Routing is explicit and deterministic, making this model suitable for complex or heterogeneous compute requirements.
![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-tag-sharded.svg)

## Cyoda Cloud Layout
The current Cyoda Cloud deployment is a multi‑tenant platform running on bare‑metal infrastructure in Hetzner datacenters (EU).

![Cyoda Cloud Architecture](../../../assets/architecture/Cyoda-Cloud-Client-View-cyoda-details.svg)

High‑level characteristics:
- Each tenant maps to a dedicated Kubernetes namespace
- Each tenant has:
  - Its own Cyoda pods 
  - A dedicated Cassandra keyspace 
  - A dedicated Trino deployment for SQL access

Cyoda and Trino can both be elastically scaled per tenant to meet:
- Event processing throughput
- Workflow execution demand
- Complex analytical query workloads

In addition to the core runtime components, the platform includes:

- Cyoda UI SPA for interactive use
- Cyoda Toolbox Server for administrators, exposing a GraphQL API for maintenance and analysis
- Apache Zookeeper for Cyoda cluster state management (multi‑tenant across namespaces)
- Prometheus and Grafana (LGTM stack) for metrics and observability
- Alertmanager for alert routing, with notifications sent to internal Google Chat

Log aggregation and analysis are currently handled by Elasticsearch and Kibana. This is expected to be consolidated into Loki and Grafana LogQL in the future.

### Scope of the Diagrams
The diagrams intentionally omit some infrastructure components to keep the focus on data flow and execution topology. Omitted elements include:

- Gateways and edge routing
- VPN and internal network details
- Authentication and identity services
- AI Studio and Cloud Manager applications
- Auxiliary load balancers and supporting services

Their purpose is to illustrate how Cyoda, client compute, storage, and query layers fit together, rather than to serve as a complete infrastructure blueprint.
