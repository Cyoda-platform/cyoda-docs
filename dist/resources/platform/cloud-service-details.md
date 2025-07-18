<!--
ABOUTME: This document provides comprehensive information about the current Cyoda Cloud service, including service characteristics, operational details, and important considerations. References cyoda-cloud-status.md for current issues and entitlements.md for subscription details.

TONE: Neutral, factual tone appropriate for alpha-phase SaaS documentation. Focus on clear, actionable information without apologetic language or marketing speak. Present current service state and capabilities.
-->

# Cyoda Cloud Service Details

This document provides detailed information about the current Cyoda Cloud service, including operational
characteristics, service boundaries, and important considerations for users.

**Current Status**: For current service status and known issues, see [Cyoda Cloud Status](cyoda-cloud-status.md).

**Subscription Details**: For tier limits and entitlements, see [Subscription Tiers](entitlements.md).

## Service Availability

### Uptime and Maintenance

- Service operates 24/7
- Planned maintenance notifications posted on [Status Page](cyoda-cloud-status.md)

### Geographic Deployment

- Single datacenter deployment in Helsinki, Finland
- Latency characteristics suitable for most development and testing use cases
- Contact us via [Discord](https://discord.com/invite/95rdAyBZr2) if latency impacts your use case

## Service Architecture

### Infrastructure Overview

- Multi-tenant platform on bare metal infrastructure
- Isolated client environments via Kubernetes namespaces
- Shared backend services (Cassandra, Zookeeper)
- External access via Cloudflare tunnel

For detailed architecture information, see [Cyoda Cloud Architecture](../architecture/cyoda-cloud-architecture.md).

### Client Integration Points

- **HTTP API**: REST endpoints for application integration
- **gRPC**: High-performance interface for compute externalization
- **JDBC**: SQL querying via Trino
- **AI Assistant**: Entry point for signing up, creating new applications via chat dialogue, provisioning and
  controlling your environment(s), and getting help. Available at [https://ai.cyoda.net](https://ai.cyoda.net)
- **Cyoda UI**: Web interface for your Cyoda environment. It's our legacy UI, but with extensive features including
  entity lifecycle configuration and observability, distributed report configuration and execution, entity model viewing
  and navigation, Trino SQL schema configuration, and deep processing manager analysis. Available at
  `https://client-<caas_user_id>.eu.cyoda.net`

## Data Management

### Storage Characteristics

- Apache Cassandra backend with replication factor 3
- Write-only entity persistence for complete audit trails
- Point-in-time querying capabilities
- No automatic backups in Free Tier

### Data Retention

- Data persists until explicitly deleted by user or exported via API
- Users responsible for data export and backup
- Data export available via HTTP API endpoints

## API and Integration

### Rate Limiting

Rate limits vary by subscription tier. See [Subscription Tiers](entitlements.md) for specific limits.

- HTTP 429 responses when limits exceeded
- Burst capacity available within limits

### Authentication

- Auth0-based human authentication for web interfaces
- OAuth 2.0 client credentials flow for technical users
- Technical user creation via [AI Assistant](https://ai.cyoda.net)

For complete authentication details, see [Authentication & Authorization](../guides/authentication-authorization.md).

## Current Service Limitations

### Alpha Phase Considerations

- Frequent platform updates and changes
- Feature set under active development
- Documentation continuously updated

### Support Channels

- Primary support via [Discord](https://discord.com/invite/95rdAyBZr2)
- Global team coverage across time zones
- Community-driven support model

### API Versioning

- API versioning planned for post-alpha release
- Client libraries available on GitHub. Lots of active development there.
- In Alpha, expect breaking changes. We'll keep people informed on the [Status Page](cyoda-cloud-status.md) and [Discord](https://discord.com/invite/95rdAyBZr2).

## Migration and Data Portability

### Data Export

- Full data export via HTTP API
- User responsibility for backup and migration
- Export formats support standard integration patterns

### Version Compatibility

- Forward compatibility planned for API versioning
- Migration tools under development
- Enterprise support available for complex migration scenarios

---

*Last updated: 2025-01-20*  
*Document version: 2.0*