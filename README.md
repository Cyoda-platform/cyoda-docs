# Cyoda API Specification

[![Deploy to GitHub Pages](https://github.com/Cyoda-platform/api-specification/actions/workflows/static.yml/badge.svg)](https://github.com/Cyoda-platform/api-specification/actions/workflows/static.yml)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

> **Central hub for Cyoda developer resources, API documentation, and onboarding materials**

This repository serves as the comprehensive documentation center for developers and AI assistants working with the Cyoda platform. It provides OpenAPI specifications, developer guides, architecture documentation, and onboarding resources in a centralized, accessible format.

## 📋 Table of Contents

- [About](#about)
- [Live Documentation](#live-documentation)
- [Project Structure](#project-structure)
- [Available Resources](#available-resources)
- [Development](#development)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## 🎯 About

Cyoda is a hybrid transactional/analytical data processing platform designed for high-volume data ingestion with concurrent processing capabilities. This repository contains:

- **OpenAPI Specifications**: Complete API documentation for Cyoda services
- **Developer Guides**: Onboarding materials and best practices
- **Architecture Documentation**: System design and deployment information
- **Authentication Guides**: Security and access control documentation
- **Living Documentation**: Continuously updated markdown resources

The project is built as a static site using [Stoplight Elements](https://stoplight.io/open-source/elements) for interactive API documentation and serves as a living resource that evolves with the platform.

## 🌐 Live Documentation

The documentation is automatically deployed to GitHub Pages and available at:
**[https://cyoda-platform.github.io/api-specification/](https://cyoda-platform.github.io/api-specification/)**

## 📁 Project Structure

```
├── dist/                          # Built documentation site
│   ├── openapi/                   # OpenAPI specifications
│   │   └── openapi.json          # Main Cyoda API specification
│   ├── resources/                 # Markdown documentation
│   │   ├── something.md
│   │   ├── something-else.md
│   ├── css/                       # Styling and themes
│   ├── js/                        # Stoplight Elements JavaScript
│   ├── images/                    # Assets and icons
│   └── index.html                 # Main documentation page
├── .github/workflows/             # GitHub Actions for deployment
└── README.md                      # This file
```

## 📚 Available Resources

### API Documentation
- **[OpenAPI Specification](dist/openapi/openapi.json)**: Complete REST API documentation
- **Interactive API Explorer**: Available in the live documentation site

### Developer Guides
- **[Authentication & Authorization](dist/resources/authentication-authorization.md)**: OAuth 2.0 implementation and security
- **[CPL Overview](dist/resources/cpl-overview.md)**: Cyoda Platform Library architecture and capabilities
- **[Cloud Architecture](dist/resources/cyoda-cloud-architecture.md)**: Physical infrastructure and deployment topology


## Development
### install http-server
npm install --global http-server

### run http-server
http-server dist

