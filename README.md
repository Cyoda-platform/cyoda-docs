# Cyoda Cloud Documentation

[![Deploy to GitHub Pages](https://github.com/Cyoda-platform/api-specification/actions/workflows/static.yml/badge.svg)](https://github.com/Cyoda-platform/api-specification/actions/workflows/static.yml)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

> **Central hub for Cyoda developer resources, API documentation, and onboarding materials**

This repository serves as the central documentation hub for developers and AI assistants working with the Cyoda platform. It provides OpenAPI specifications, developer guides, architecture documentation, and onboarding resources in a centralized, accessible format.

## Table of Contents

- [About](#about)
- [Live Documentation](#live-documentation)
- [Project Structure](#project-structure)
- [Available Resources](#available-resources)
- [Development](#development)

## About

Cyoda is a hybrid transactional/analytical data processing platform designed for high-volume data ingestion with concurrent processing capabilities. This repository contains:

- **OpenAPI Specifications**: Complete API documentation for Cyoda services
- **Developer Guides**: Onboarding materials and best practices
- **Architecture Documentation**: System design and deployment information
- **Authentication Guides**: Security and access control documentation
- **Living Documentation**: Continuously updated markdown resources

The project is built as a static site using [Stoplight Elements](https://stoplight.io/open-source/elements) for interactive API documentation and serves as a living resource that evolves with the platform.

## Live Documentation

The documentation is automatically deployed to GitHub Pages and available at:
**[https://docs.cyoda.net/](https://docs.cyoda.net/)**

## Project Structure

```
├── dist/                          # Built documentation site
│   ├── openapi/                   # OpenAPI specifications
│   │   └── openapi.json           # Main Cyoda API specification
│   ├── resources/                 # Markdown documentation organized in sub-folders
│   │   ├── sub-folder/           
│   │   │   ├── some-doc.md
│   │   │   └── some-other-doc.md
│   │   ├── another-folder/          
│   │   │   └── something-else.md
│   │   └── ...
│   ├── css/                       # Styling and themes
│   ├── js/                        # Stoplight Elements JavaScript
│   ├── images/                    # Assets and icons
│   └── index.html                 # Main documentation page
├── .github/workflows/             # GitHub Actions for deployment
├── README.md                      # This file
└── ...                            # other stuff
```

## Available Resources

### API Documentation
- **[OpenAPI Specification](dist/openapi/openapi.json)**: Complete REST API documentation
- **Interactive API Explorer**: Available in the live documentation site

### Developer Guides
- **[Authentication & Authorization](dist/resources/guides/authentication-authorization.md)**: OAuth 2.0 implementation and security
- **[Cyoda Platform Library](dist/resources/guides/cpl-overview.md)**: Cyoda Platform Library architecture and capabilities
- **[Entity Database](dist/resources/guides/cyoda-entity-database.md)**: Entity modeling and database concepts

### Architecture Documentation
- **[Cloud Architecture](dist/resources/architecture/cyoda-cloud-architecture.md)**: Physical infrastructure and deployment topology

### Platform Information
- **[Cloud Status](dist/resources/platform/cyoda-cloud-status.md)**: Current service status and known issues
- **[Service Details](dist/resources/platform/cloud-service-details.md)**: Comprehensive service information and limitations
- **[Subscription Tiers](dist/resources/platform/entitlements.md)**: Available subscription tiers and entitlements


## Development
### install http-server
npm install --global http-server

### run http-server
http-server dist

