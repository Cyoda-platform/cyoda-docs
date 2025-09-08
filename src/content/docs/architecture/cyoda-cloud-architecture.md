---
layout: docs
title: "Cloud Architecture"
description: Physical architecture for Cyoda Cloud deployment
order: 1
eleventyNavigation:
  key: Cyoda Cloud Architecture
  parent: Architecture
  order: 1
---

This document describes the current physical architecture for Cyoda Cloud's soft launch deployment, supporting **free tier** subscribers. The architecture provides a multi-tenant platform running on bare metal infrastructure in Hetzner datacenters, with isolated client environments and shared backend services.

This diagram shows the core components and data flow. Many operational elements are not depicted, including tunnel gateways, internal network/VPN infrastructure, Prometheus/Grafana monitoring, log aggregators, authentication services, AI Assistant app, Cloud Manager app, additional load balancers, and other supporting services.

## Cluster-Level Architecture
```mermaid
flowchart LR
    %% STYLES
    classDef cyoda fill:#F5FAF9,stroke:#4FB8B0,stroke-width:3px
    classDef client fill:#F5F7F9,stroke:#FD9E29,stroke-width:3px
    classDef external fill:#F5F7F9,stroke:#5A18AC,stroke-width:2px,stroke-dasharray: 5 3
    classDef loadBalancer fill:#F5F0F9,stroke:#6BB45A,stroke-width:2px
    classDef namespace fill:#F5F7F9,stroke:#4FB8B0,stroke-width:2px
    classDef bareMetal fill:#F9F7F9,stroke:#3a8a84,stroke-width:2px

    %% HETZNER DATACENTER FRAME
    subgraph HETZNER["Hetzner Datacenter"]
        direction TB
        
        %% Bare Metal Cassandra
        CASS["Cassandra Cluster\n(3 Nodes)\n(Bare Metal)\n\nPer-Client Keyspaces\nRF=3, CL=QUORUM\nBatched Prepared Statements"]:::bareMetal
        
        %% KUBERNETES FRAME
        subgraph K8S["Kubernetes Cluster (on Bare Metal)"]
            direction TB
            ZK["Zookeeper Cluster"]:::cyoda
            
            %% CLIENT ENVIRONMENT NAMESPACE
            subgraph NS["Client Environment [namespace]"]
                direction TB
                
                %% NGINX EXTERNAL FRAME
                subgraph NGINX["nginx-external"]
                    LB_HTTP["nginx-ingress\n(HTTP API)"]:::loadBalancer
                    LB_GRPC["nginx-ingress\n(gRPC)"]:::loadBalancer
                    LB_JDBC["nginx-ingress\n(JDBC)"]:::loadBalancer
                    LB_UI["nginx-ingress\n(UI)"]:::loadBalancer
                end
                class NGINX loadBalancer
                
                CPM["CPM Cluster"]:::namespace
                TRINO["Trino Cluster"]:::namespace
                UI["UI Service"]:::namespace
            end
            class NS namespace
        end
        class K8S cyoda
    end
    class HETZNER cyoda

    %% CLIENT FRAME
    subgraph CLIENT["Client-Side (External)"]
        direction TB
        CC["Client Compute Cluster"]:::client
        CA["Client Application Nodes"]:::client
    end
    class CLIENT client

    %% External Element
    CF["Cloudflare Tunnel"]:::external

    %% CONNECTIONS
    
    %% Client to Cloudflare Tunnel
    CC -->|gRPC| CF
    CA -->|HTTP API| CF
    CA -->|JDBC| CF
    CA -->|HTTP| CF

    %% Cloudflare Tunnel to ingresses
    CF -->|gRPC| LB_GRPC
    CF -->|HTTP API| LB_HTTP
    CF -->|JDBC| LB_JDBC
    CF -->|HTTP| LB_UI

    %% Ingresses to services
    LB_GRPC -->|gRPC| CPM
    LB_HTTP -->|HTTP API| CPM
    LB_JDBC -->|JDBC| TRINO
    LB_UI -->|HTTP| UI

    %% Internal connections
    CPM -->|CQL| CASS
    CPM -->|TCP| ZK
    TRINO -->|rsocket| CPM
```


## Architecture Rules

### Components

The setup consists of:
- A Cassandra cluster (C*) - N nodes on bare metal (4+)
- Cyoda Processing Manager cluster (CPM) - containerized in Kubernetes
- Trino cluster (TSQL) - containerized in Kubernetes  
- Zookeeper cluster (ZK) - containerized in Kubernetes
- Client Compute cluster (CC) - external, client-operated
- Client Application Cluster (CA) - external, client-operated
- UI Service - containerized in Kubernetes
- nginx-ingress controllers - containerized in Kubernetes

### Infrastructure

**Cyoda Cloud Infrastructure:**
- CPM, TSQL, ZK, UI, and nginx-ingress run on Kubernetes cluster on bare metal in Hetzner datacenter
- C* runs directly on bare metal in Hetzner datacenter (outside Kubernetes)
- Each client environment operates within an isolated Kubernetes namespace
- Shared services (C*, ZK) serve multiple client environments

**Client Infrastructure:**
- CC and CA are external, client-operated clusters
- CC encapsulates client business logic for compute externalization
- CA hosts client applications consuming Cyoda services
- CA and CC may be physically the same runtime

### Data Storage

**Cassandra Configuration:**
- Per-client keyspaces for data isolation
- Replication factor = 3 across all nodes
- Consistency level = QUORUM for all operations
- All writes use batched prepared statements

### Network Connectivity

**Internal Connections:**
- CPM connects to C* via CQL for data persistence and querying
- CPM connects to ZK via TCP for cluster state management
- TSQL connects to CPM via rsocket for SQL query processing

**External Access:**
- All external access routes through Cloudflare tunnel
- Access is load-balanced through nginx-ingress controllers within each namespace
- CC connects to CPM via gRPC for compute externalization
- CA connects to CPM via HTTP API for application integration
- CA connects to TSQL via JDBC for SQL querying
- CA connects to UI via HTTP for web interface access

### Service Endpoints

**CPM Endpoints:**
- gRPC interface for high-performance compute externalization
- HTTP API for standard application integration (via HTTPS)

**TSQL Endpoints:**
- JDBC interface for SQL querying over flexible schemas

**UI Endpoints:**
- HTTP interface for web-based user interaction

### Access Control

External network access to Cyoda Cloud is exclusively via:
- Cloudflare tunnel as the single entry point
- nginx-ingress controllers providing protocol-specific load balancing
- No direct access to internal services bypassing the ingress layer

### Operational Responsibility

**Cyoda Cloud Operated:**
- CPM, TSQL, ZK, UI, nginx-ingress (Kubernetes workloads)
- C* (bare metal database cluster)
- All infrastructure within Hetzner datacenter

**Client Operated:**
- CC (compute externalization nodes)
- CA (application integration nodes)
- All external client infrastructure
