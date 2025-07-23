# Cyoda Cloud Authentication & Authorization Guide

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

The Free Tier includes the following limits:
- **Model Fields**: 50 fields maximum
- **Payload Size**: 100KB per request
- **API Requests**: 60 requests per minute
- **Externalized Calls**: 60 calls per minute

## Environment Setup and Provisioning

**THIS IS A MAJOR WORK IN PROGRESS!**
If you follow the normal onboarding flow via the AI Assistant, you'll get all the information needed to access your environment.

> [!IMPORTANT]
> Make sure you save your deployment ID. If you give this to the AI Assistant, it will be able to help you create a technical user or control your environment.

If you struggle, reach out to us on [Discord](https://discord.gg/95rdAyBZr2)

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
2. **Request Technical User**: Prompt the AI Assistant with your environment name and request to create a technical user
   ```
   Example prompt: "Please create a technical user for my environment [your-environment-url]"
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

- **Algorithm**: RS256 (RSA Signature with SHA-256)
- **Expiration**: 5 minutes
- **Issuer**: Cyoda Ltd.
- **Claims**: Include user ID, roles, and legal entity information

### Tenant Isolation

- **Legal Entity Boundaries**: Data and operations are isolated by legal entity
- **Multi-tenancy**: Each organization operates in its own isolated environment
- **Access Control**: Users can only access resources within their legal entity

### Credential Management

- **Secure Generation**: Client secrets use cryptographically secure random generation
- **BCrypt Hashing**: Secrets are stored using BCrypt hashing
- **Rotation Support**: Secrets can be rotated via API/gRPC call.

