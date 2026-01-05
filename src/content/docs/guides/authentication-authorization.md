---
title: "Authentication & Authorization"
description: OAuth 2.0-based authentication system for Cyoda Cloud
sidebar:
  order: 5
---

## Overview

Cyoda Cloud provides a secure, OAuth 2.0-based authentication system designed for developers building applications that integrate with the Cyoda platform. This guide explains the authentication flow from user registration to API integration.

## Table of Contents

1. [User Registration](#user-registration)
2. [Environment Setup and Provisioning](#environment-setup-and-provisioning)
3. [Technical User Creation](#technical-user-creation)
4. [Authentication Flows](#authentication-flows)
5. [Security Features](#security-features)

## User Registration

### Prerequisites

Before using Cyoda Cloud, you must:

1. **Review Legal Documents**: Carefully read and understand the Terms & Conditions and Data Privacy Policy
2. **Accept Compliance**: Ensure full understanding and acceptance of all terms before proceeding

### Registration Process

1. **Access the AI Assistant**: Navigate to the Cyoda Cloud web-based Single Page Application (SPA)
2. **Choose Authentication Provider**: Register using one of the supported providers:
    - **Google Auth**: Sign up using your Google account
    - **GitHub**: Sign up using your GitHub account
3. **Complete Registration**: Follow the Auth0 authentication flow to complete your account setup
4. **Free Tier Access**: Upon successful registration, you'll be automatically enrolled in the Free Tier subscription

### Free Tier Limitations

See [Entitlements](/cloud/entitlements/#subscription-tiers-overview)

## Environment Setup and Provisioning

See [Provision Environment](/guides/provision-environment/)

## Connection

Your environment has several service endpoints, which are determined by your CAAS user ID.

| Service | URL Pattern                                      | Description |
|---------|--------------------------------------------------|-------------|
| Cyoda UI | `https://client-<caas_user_id>.eu.cyoda.net`     | Web interface for your Cyoda environment |
| HTTP API | `https://client-<caas_user_id>.eu.cyoda.net/api` | Base URL for REST API endpoints |
| gRPC | `grpc-client-<caas_user_id>.eu.cyoda.net`        | gRPC service access endpoint |
| JDBC/Trino | `jdbc:trino://trino-client-<caas_user_id>.eu.cyoda.net:443`  | Database query interface via Trino |

## Technical User Creation

### Overview

You need a technical user to access your Cyoda Cloud API outside of the UI (Cyoda UI or AI Assistant). Technical users are machine-to-machine (M2M) clients authenticated using OAuth 2.0 client credentials flow.

### Creation Process

1. **Login Requirement**: You must be logged into the AI Assistant
2. **Request Technical User**: Prompt the AI Assistant with your environment name and request to create a new technical user
   ```
   Example prompt: "add new machine user"
   ```
3. **Receive Credentials**: The AI Assistant will provide:
    - **Client ID**: Unique identifier for your technical user
    - **Client Secret**: Secret key for authentication (shown only once)

### Important Security Notes

- **One-Time Display**: The client secret is shown only once during creation
- **Secure Storage**: Store credentials securely in your application configuration
- **No Recovery**: Lost secrets cannot be recovered; you must create a new technical user
- **Rotation**: Regularly rotate credentials for enhanced security

## Authentication Flows

### OAuth 2.0 Client Credentials Grant

Cyoda Cloud implements the standard OAuth 2.0 Client Credentials Grant (RFC 6749) for machine-to-machine authentication. All service endpoints support this flow.

## Security Features

### JWT Tokens

Cyoda Cloud issues short-lived JWT access tokens.

- **Algorithms**: Asymmetric signature algorithms only: `RS256`, `RS384`, `RS512`, `ES256`, `ES384`, `ES512`, `PS256`, `PS384`, `PS512`, `EdDSA`
- **Expiration**: Typically around a few minutes for access tokens (configurable)
- **Issuer**: Cyoda Cloud (or a trusted OIDC provider configured in a custom setups)
- **Key material**: Signing keys managed by Cyoda can be rotated via the JWT signing keys mechanism. For more details, see [JWT Signing Keys](/guides/iam-jwt-keys-and-oidc/).
- **Claims**: Include user identifier, roles and legal entity (tenant) information.

> **Note**
> When you integrate a custom OIDC provider, its tokens must contain additional claims required by Cyoda Cloud (for example `sub`, `caas_org_id`, `user_roles`). See [OIDC Providers & JWT Claims](/guides/iam-oidc-and-jwt-claims/) for details.

### Tenant Isolation

- **Legal Entity Boundaries**: Data and operations are isolated by legal entity
- **Multi-tenancy**: Each organization operates in its own isolated environment
- **Access Control**: Users can only access resources within their legal entity

### Credential Management

- **Secure Generation**: Client secrets use cryptographically secure random generation
- **BCrypt Hashing**: Secrets are stored using BCrypt hashing
- **Rotation Support**: Secrets can be rotated via API/gRPC call.

