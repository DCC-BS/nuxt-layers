# Nuxt Layers

This repository contains reusable Nuxt layers (shared code) designed for DCC-BS Nuxt AI applications. These layers provide authentication, backend communication, and health check functionality that can be easily extended and customized.

## Overview

Nuxt layers allow you to share and reuse code across multiple Nuxt applications. This monorepo contains several layers that work together to provide a complete foundation for building authenticated web applications with backend API integration.

## Available Layers

### 🔐 Auth (`auth`)

**Entry layer for authentication** - Provides common type definitions and a mechanism to dynamically load authentication implementation layers.

- **Purpose**: Base authentication layer that defines the authentication interface and types
- **Key Features**:
  - Common type definitions (`User`, `AuthData`) shared across all auth implementations
  - Dynamic auth implementation loading via `AUTH_LAYER_URI` environment variable
  - Type-safe authentication contracts
- **Usage**: Extend this layer in your Nuxt app and specify which auth implementation to use via environment variable

```typescript
// Automatically loads implementation based on AUTH_LAYER_URI env variable
extends: ["github:DCC-BS/nuxt-layers/auth", { install: true }],
```

### 🔷 Azure Auth (`azure-auth`)

**Azure AD authentication implementation** - Production-ready authentication using Microsoft Azure Active Directory.

- **Purpose**: Provides Azure AD/Entra ID authentication
- **Key Features**:
  - OAuth 2.0 / OpenID Connect flow with Azure AD
  - Automatic token refresh and management
  - Provides `authHandler` for backend communication with Azure bearer tokens
  - User profile integration
- **Usage**: Set `AUTH_LAYER_URI=github:DCC-BS/nuxt-layers/azure-auth` to use Azure authentication

### 🔓 No Auth (`no-auth`)

**No-authentication implementation** - For development, testing, or public applications.

- **Purpose**: Stub implementation when authentication is not required
- **Key Features**:
  - Bypasses authentication checks
  - Useful for local development and debugging
  - Provides basic `authHandler` without authentication headers
- **Usage**: Set `AUTH_LAYER_URI=github:DCC-BS/nuxt-layers/no-auth` for development or public apps

### 🔌 Backend Communication (`backend_communication`)

**Server-side API communication helpers** - Provides utilities for Nuxt server routes to communicate with backend APIs.

- **Purpose**: Simplifies and standardizes backend API communication from Nuxt server routes
- **Key Features**:
  - `backendHandlerBuilder()` - Fluent API for configuring API handlers
  - Configurable request body providers, fetchers, and response transformers
  - Built-in error handling and transformation
  - Type-safe request/response handling
  - Extensible fetch options (e.g., for adding auth headers)
- **Common Use Cases**:
  - Pass-through client API requests to backend services
  - Transform requests/responses between client and backend
  - Add authentication headers (via auth implementations)
  - Centralized error handling

**Example**:
```typescript
// Basic pass-through handler
export default authHandler.build('/api/endpoint');

// Custom handler with transformations
export default backendHandlerBuilder()
  .withMethod('GET')
  .extendFetchOptions(async (options) => ({
    ...options,
    headers: { ...options.headers, 'Custom-Header': 'value' }
  }))
  .postMap(async (response) => transformResponse(response))
  .build('/api/data');
```

### 💚 Health Checks (`health_check`)

**Kubernetes-ready health check endpoints** - Provides standard health check API endpoints.

- **Purpose**: Enable container orchestration health monitoring (Kubernetes, Docker, etc.)
- **Key Features**:
  - `/health/liveness` - Container liveness probe (checks if app is running)
  - `/health/readiness` - Readiness probe (checks if app can serve traffic)
  - `/health/startup` - Startup probe (checks if app has started successfully)
  - Lightweight checks that don't impact performance
- **Usage**: Configure your Kubernetes deployment to use these endpoints for pod health monitoring

## Architecture

The layers work together in the following way:

```
┌─────────────────────────────────────────┐
│         Your Nuxt Application           │
├─────────────────────────────────────────┤
│  Auth Layer (base)                      │
│    ├─ Azure Auth (implementation)       │
│    └─ No Auth (implementation)          │
│                                          │
│  Backend Communication                  │
│    └─ Used by auth implementations      │
│                                          │
│  Health Checks                          │
└─────────────────────────────────────────┘
```

1. **Auth Layer** provides the interface and dynamically loads an implementation
2. **Auth Implementations** (Azure/No-Auth) extend the base auth layer and use `backend_communication` to provide an `authHandler`
3. **Backend Communication** is used independently or by auth layers to handle API requests
4. **Health Checks** operates independently to provide monitoring endpoints

## Getting Started

### Installation

Add the layers you need to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  extends: [
    ['github:DCC-BS/nuxt-layers/auth', { install: true }],
    ['github:DCC-BS/nuxt-layers/health_check', { install: true }]
  ]
})
```

### Configuration

Set required environment variables:

```bash
# API backend URL
API_URL=https://api.example.com

# Authentication implementation
AUTH_LAYER_URI=github:DCC-BS/nuxt-layers/azure-auth
```

### Development

This is a Bun monorepo workspace. To work on the layers:

```bash
# Install dependencies
bun install

# Work on individual layers in their respective directories
cd auth
bun dev  # Starts playground for testing
```

## License

[MIT](LICENSE) © Data Competence Center Basel-Stadt

<a href="https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenwissenschaften-und-ki"><img src="https://github.com/DCC-BS/.github/blob/main/_imgs/databs_log.png?raw=true" alt="DCC Logo" width="200" /></a>

Datenwissenschaften und KI  
Developed with ❤️ by DCC - Data Competence Center
