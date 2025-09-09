---
title: Quick Start Guide
description: Get up and running with Cyoda in under 10 minutes
sidebar:
  order: 2
---

# Quick Start Guide

Get your first Cyoda environment running in under 10 minutes with our AI-powered provisioning system.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A Google or GitHub account for authentication
- 5-10 minutes of your time

## Step 1: Access the AI Assistant

Navigate to [https://ai.cyoda.net](https://ai.cyoda.net) in your web browser.

You'll be greeted by the Cyoda AI Assistant, your intelligent guide to the platform.

## Step 2: Authenticate

Choose your preferred authentication method:

- **Google Account**: Sign in with your Google credentials
- **GitHub Account**: Sign in with your GitHub credentials

The AI Assistant uses Auth0 for secure authentication, ensuring your credentials are protected.

## Step 3: Deploy Your Environment

Once authenticated, simply tell the AI Assistant:

```
Please deploy my Cyoda environment
```

The AI will:
1. Provision a dedicated cloud environment for you
2. Set up all necessary infrastructure
3. Configure your Free Tier subscription
4. Provide you with your unique environment URL

**⏱️ This process typically takes 2-3 minutes.**

## Step 4: Create a Technical User

For API access, create a technical user by prompting:

```
Please create a technical user for my environment
```

The AI will generate:
- **Client ID**: Your application identifier
- **Client Secret**: Your authentication secret

**🔒 Important**: Save these credentials securely - you'll need them for API access.

## Step 5: Access Your Environment

You now have two ways to interact with your Cyoda environment:

### Via the Web UI

Navigate to your environment URL:
```
https://client-<your_user_id>.eu.cyoda.net
```

Log in with your personal credentials (Google/GitHub) to access the visual interface.

### Via the API

Use your technical user credentials to authenticate API requests:

```bash
curl -X POST https://client-<your_user_id>.eu.cyoda.net/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials"
  }'
```

## What's Next?

### Explore the Platform
- **Entities**: Create your first business entity
- **Workflows**: Define state transitions and business rules
- **Events**: Trigger entity state changes
- **Processors**: Implement custom business logic

### Learn the Concepts
- [Entity Database Management System](/concepts/edbms/)
- [Event-Driven Architecture](/concepts/event-driven-architecture/)
- [CPL Overview](/concepts/cpl-overview/)

### Build Your First Application
- [API: Saving and Getting Data](/guides/api-saving-and-getting-data/)
- [Authentication & Authorization](/guides/authentication-authorization/)
- [Cyoda Design Principles](/guides/cyoda-design-principles/)

## Troubleshooting

### Environment Not Accessible
If your environment URL isn't working:
1. Wait a few more minutes for provisioning to complete
2. Check the AI Assistant for any error messages
3. Try refreshing your browser

### Authentication Issues
If you can't log in:
1. Ensure you're using the same account type (Google/GitHub) used for registration
2. Clear your browser cache and cookies
3. Try an incognito/private browsing window

### API Access Problems
If API calls are failing:
1. Verify your client credentials are correct
2. Ensure you're using the correct environment URL
3. Check that your technical user was created successfully

## Getting Help

- **AI Assistant**: Ask questions directly at [https://ai.cyoda.net](https://ai.cyoda.net)
- **Documentation**: Browse our [guides](/guides/)
- **Community**: Connect with other developers on our platform

## Free Tier Limits

Your Free Tier environment includes:
- **Entities**: Up to 1,000 entity instances
- **API Calls**: 10,000 requests per month
- **Storage**: 1GB of entity data
- **Workflows**: Unlimited workflow definitions

Ready to scale? Contact us about upgrading to a paid plan with higher limits and additional features.

---

**🎉 Congratulations!** You now have a fully functional Cyoda environment. Start building intelligent, event-driven applications with the power of entity workflows.
