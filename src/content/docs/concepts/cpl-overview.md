---
title: "Cyoda Platform Library"
description: Overview of the Cyoda Platform Library (CPL)
sidebar:
  order: 3
---

Cyoda Cloud is based on the Cyoda Platform Library (CPL), a hybrid transactional/analytical data processing platform designed for high-volume data ingestion with concurrent transactional and analytical processing capabilities.

## Overview

Cyoda Cloud operates as a distributed platform that ingests high volumes of data while enabling simultaneous transactional and analytical processing. The platform maintains full ACID properties across horizontally scalable architecture with no bottlenecks, supporting complex, disparate data storage, processing, and querying at scale.

## Core Architecture

### Horizontal Scalability
The platform employs a distributed architecture that interacts with an arbitrary number of nodes across geographic locations. This design eliminates single points of failure and enables linear scaling as data volumes and processing requirements grow.

### High Availability
Cyoda's distributed node architecture ensures continuous operation through redundancy and fault tolerance. The platform coordinates between geographically distributed nodes using Apache Zookeeper™ v3.6.3 for cluster coordination, while Apache Cassandra® v4.1.3 provides the distributed storage backend.

## Data Management

### Dynamic Entity Modeling and Persistence
The platform supports dynamic entity modeling where business objects exist as state machines. Each entity associates with a workflow that defines available states, possible transitions, and processes that execute during state changes. Entities maintain write-only persistence characteristics, ensuring data immutability and complete audit trails.

### Entity Workflow System
Every business object operates as an event-driven, finite, distributed state machine. The workflow graph consists of states, transitions, processes, and criteria. Users can specialize state machines for specific entities through the UI, enabling rapid system evolution compared to code-only approaches.

## Processing Architecture

### Transactional Event-Driven Processing
The platform processes all operations through state machine workflows. This event-driven approach enables complex business logic implementation while maintaining transactional consistency across distributed operations. The system supports synchronous and asynchronous processing patterns.

### Indexing Capabilities
Cyoda provides comprehensive indexing for range fields and composite indexing strategies. The indexing system supports complex query patterns while maintaining performance across large datasets. Index configurations can be customized per entity type and use case.

## Query and Reporting

### Point-in-Time Querying
The platform supports synchronous data querying with point-in-time consistency. This capability enables users to query data states at specific moments, supporting both operational queries and analytical workloads.

### Distributed Reporting
Asynchronous distributed reporting capabilities enable complex analytical processing across the entire platform. The reporting system can aggregate data across multiple nodes and time periods while maintaining consistency and performance.

## Security and Permissions

### AccessDecisionTree Framework
Cyoda implements a decision-tree mechanism for authentication and authorization. The AccessDecisionTree evaluates access permissions for CRUD operations (CREATE, READ, UPDATE, DELETE) on entities. The system combines CREATE and UPDATE operations into a single WRITE operation for simplified internal logic.

The decision tree operates as a compact classical decision tree where each node can function as a terminal node. Each node carries decision information for cases where traversal stops at that point. The framework supports:

- Role-based access control
- Entity-type specific permissions
- Field-level masking for partial access
- Performance-optimized permission evaluation

## Technical Requirements

### Storage Backend
- Apache Cassandra® v4/v5 database cluster
- Apache Zookeeper™ v3.6.3 cluster for coordination

### Integration Capabilities
- gRPC and REST API support
- Client libraries for multiple programming languages
- Workflow configuration through visual designer
- Programmatic workflow definition

## Key Features Summary

- **Data Modeling**: Dynamic entity persistence with workflow-driven state machines
- **Scalability**: Horizontally scalable with no architectural bottlenecks
- **Availability**: Distributed, fault-tolerant architecture
- **Processing**: Event-driven transactional and analytical processing
- **Querying**: Point-in-time queries and distributed reporting
- **Security**: Comprehensive permission system via AccessDecisionTree
- **Integration**: Multiple API interfaces and client library support
- **Auditing**: Complete audit trails through write-only entity persistence
- **Indexing**: Advanced indexing for range and composite queries

The platform serves as a cohesive technology foundation for scalable and agile architectures, particularly suited for core financial services operations requiring high-volume data processing with strict consistency guarantees.