
<!--
ABOUTME: This document provides comprehensive, detailed information on caveats, limitations, and gotchas for Cyoda Cloud Free Tier users. Supplements the quick reference guide in cyoda-cloud-status.md with in-depth explanations and context.

TONE: Neutral, factual tone appropriate for alpha-phase SaaS documentation. Focus on clear, actionable information without apologetic language or marketing speak. Present limitations as current state rather than permanent restrictions.
-->

# Cyoda Cloud Free Tier - Current Limitations and Considerations

Here are details on current limitations, known issues, and important considerations when using Cyoda Cloud Free Tier. We update the information as the platform evolves through alpha development.

**Quick Reference**: For a concise overview of the most relevant limitations, see [Cyoda Cloud Free Tier - Quick Status Overview](cyoda-cloud-status.md).

## Service Availability

### Uptime and Maintenance
- We're up 24/7
- No maintenance windows scheduled at the moment
- We'll update the [Status Page](cyoda-cloud-status.md) for any planned maintenance

### Geographic Limitations
- The service is currently deployed in a single datacenter in Helsinki, Finland
- We think the latencies to Helsinki are acceptable for most Free Tier use cases. Let us know if it's a problem.

## Performance Characteristics

The Free Tier is designed for low to moderate usage. It's not intended for high-volume production workloads. If you need more performance, please contact us to discuss upgrade options.

We are working on providing details automatically 
Your subscription entitlements can be found at the HTTP API endpoint /api/user/account/info in your environment. 

### Throughput Limits
- **Ingestion rate limits**: see your subscription details
- **Query performance**: see your subscription details
- **Concurrency limits**: see your subscription details

### Resource Constraints
- **Storage capacity**: it's on your subscription details
- **Compute node CPU and memory**: In Free Tier, you can attach a single compute node. It can be sized as you like, because you're the one running and attaching it to your Cyoda environment. 
- **Cyoda Cloud CPU and memory**: Let's just say that with the given constraints on throughput, querying and storage, you shouldn't be hitting limits on CPU or memory on your Cyoda Cloud resources. If people are interested, you can check out the [Cyoda Cloud Architecture document] (cyoda-cloud-architecture.md) for more details on the infrastructure.


## Data Management

### Retention Policies
- We don't delete your data unless we have an accident or you ask for it, or do it yourself.
- For Free Tier, we don't backup your data. Your data is stored in Cassandra with a replication factor of 3.
- You can export your data via the HTTP API.

### Entity Model Limitations
- **Model versioning
- [Placeholder for migration considerations]

## API and Integration

### Rate Limiting
- **API call limits**: see your subscription details
- **gRPC call limits**: see your subscription details
- **Burst limits**: see your subscription details
- You'll get a 429 response if you hit the rate limit.

### Authentication and Security
- Check [Authentication and Authorization](authentication-authorization.md)
- At the moment, we are using Auth0 for human authentication (in our UIs). An authenticated user can create a technical user for access to your environment via HTTP API and gRPC, for example, via the Cyoda [AI Assistant](https://ai.cyoda.net). Prompt it with your environment name to give you a technical user. You get a client ID and secret for the technical user. You can use it to authenticate via HTTP API and gRPC via oauth2 client credentials flow.


## Known Issues

### Current Bugs
- [Placeholder for documented issues] We'll be posting them as issues in GitHub.
- [Placeholder for workarounds] We'll be posting them as comments on the issues in GitHub.

### Feature Gaps
- [Placeholder for missing functionality] We'll be posting our roadmap soon. Not sure where, yet. We need traction first!

## Support and Documentation

### Support Channels
- We are on [Discord](https://discord.com/invite/95rdAyBZr2). Talk to us!
- Our team is spread all over the world. Chances are good that someone will see your message on discord any time of the day. A lot of us work weekends, too, but no promises.

### Documentation Status
- Forever Draft
- Updated as often as we can, especially if users complain!

## Migration and Compatibility

### Version Compatibility
- We'll be versioning our API once we get out of alpha.
- Client libraries are on Github. Help us!

### Data Migration
- In Free Tier, you're responsible to export your data via the APIs
- If you want formal support, let's talk!

---

*Last updated: [2025-07-17]*  
*Document version: 1.0*