# Cyoda Cloud Subscription Tier Entitlements

## Introduction

Access to Cyoda Cloud is subscription-tier-based. This document provides details about the available subscription tiers and their entitlements.

**Important**: The information in this document is for reference purposes and is not guaranteed to be correct. The authoritative source for your account's current subscription details and entitlements is available through the Cyoda Cloud API at the following endpoints:

- **Current Account Information**: `GET /account` - Retrieve information about the current user's account, including current subscription
- **All Available Subscriptions**: `GET /account/subscriptions` - Retrieve all subscriptions available for the current user's legal entity

For complete API documentation, refer to the OpenAPI specification.

## Subscription Tiers Overview

| Entitlement | Free | Developer | Pro | Enterprise License<sup>1</sup> |
| --- | --- | --- | --- | --- |
| **Status** | <span style="background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px;">Available</span> | <span style="background-color: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px;">Draft (unavailable)</span> | <span style="background-color: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px;">Draft (unavailable)</span> | <span style="background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px;">Available</span> |
| **Model Fields (per model)** | 50 | <span style="color: #6c757d;">100</span> | <span style="color: #6c757d;">500</span> | Unlimited |
| **Model Fields (cumulative)** | 100 | <span style="color: #6c757d;">500</span> | <span style="color: #6c757d;">2000</span> | Unlimited |
| **Models** | 10 | <span style="color: #6c757d;">25</span> | <span style="color: #6c757d;">100</span> | Unlimited |
| **Client Nodes** | 1 | <span style="color: #6c757d;">5</span> | <span style="color: #6c757d;">20</span> | Unlimited |
| **Payload Size** | 100 KB | <span style="color: #6c757d;">5 MB</span> | <span style="color: #6c757d;">50 MB</span> | Unlimited |
| **Disk Usage** | 1 GB | <span style="color: #6c757d;">10 GB</span> | <span style="color: #6c757d;">1 TB</span> | Unlimited |
| **API Requests** | 300/min | <span style="color: #6c757d;">600/min</span> | <span style="color: #6c757d;">50/sec</span> | Unlimited |
| **External Calls** | 300/min | <span style="color: #6c757d;">600/min</span> | <span style="color: #6c757d;">50/sec</span> | Unlimited |

<sup>1</sup> _Enterprise License is for the Cyoda Cloud system that clients operate themselves (outside of Cyoda Cloud). Contact us for details._

**Status Legend:**
- **Available**: Tier is currently available for subscription
- **Draft (unavailable)**: Tier is in planning/development phase and not yet available

## Entitlement Definitions

The following section provides detailed definitions for each entitlement ID used in the subscription tiers:

| Entitlement ID | Description |
| --- | --- |
| `num-model-fields` | Maximum number of fields allowed per individual data model. This controls the complexity of each model you can create. |
| `num-model-fields-cumulative` | Total number of fields allowed across all data models in your account. This is the sum of fields across all your models. |
| `num-models` | Maximum number of data models you can create in your account. Each model represents a different data structure or entity type. |
| `num-client-nodes` | Maximum number of client nodes that can connect to your Cyoda Cloud instance simultaneously. This controls concurrent access capacity. |
| `payload-size` | Maximum size in bytes for individual API request payloads. This limits the amount of data you can send in a single API call. |
| `disk-usage` | Maximum disk storage space allocated for your account data in bytes. This includes all stored models, data, and metadata. |
| `api-request` | Maximum number of API requests allowed per time interval. This controls the rate at which you can make API calls. |
| `externalized-call` | Maximum number of external service calls allowed per time interval. This applies to calls made from your Cyoda Cloud instance to external systems. |

---

*This document is automatically generated from subscription tier configuration data, and may deviate from your actual settings. For the most current and accurate information about your specific account entitlements, please refer to the `/account` API endpoints.*

Generated on 2025-07-18T13:29:36.329722
