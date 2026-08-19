# OPSAlchemy Architecture

## System Shape

OPSAlchemy is a modular monolith built with Next.js. A single deployable application keeps the initial operational footprint small, while clean boundaries prevent framework and vendor concerns from becoming business rules.

```text
Browser
  -> Next.js presentation and route handlers
    -> Application use cases
      -> Domain rules
      -> Application ports
        <- Infrastructure adapters
           OpenAI, persistence, GHL, email, analytics
```

## Layer Responsibilities

### Domain

Owns OPSAlchemy business language, invariants, and deterministic decisions. It has no dependency on Next.js, React, OpenAI, GHL, databases, or environment variables.

### Application

Coordinates use cases and transactions. It depends on domain types and defines ports for capabilities supplied by external systems.

### Infrastructure

Implements application ports with vendor SDKs and I/O. Adapters translate vendor responses and failures into application-owned types.

### Presentation

Owns Next.js pages, components, forms, and route handlers. It validates untrusted transport input, invokes application use cases, and formats safe output. It does not decide business policy.

### Composition

Server-only composition modules instantiate infrastructure adapters and inject them into use cases. This is the only layer that should know concrete implementations for an application port.

## Dependency Rules

- Domain depends on nothing outside the domain.
- Application may depend on domain, but not infrastructure or presentation.
- Infrastructure may depend on application ports and domain types.
- Presentation may depend on application use cases and presentation components.
- Server composition may depend on all layers to wire the application.
- Client components must never import server configuration, vendor credentials, or server composition.

ESLint enforces the most important domain and application import restrictions.

## Trust Boundaries

Untrusted inputs include browser messages, forms, microphone transcripts, uploaded files, webhook payloads, query parameters, cookies, headers, and third-party API responses. Validation belongs at the authoritative server boundary before these values reach application or domain logic.

## Planned Adapters

- OpenAI Responses adapter for grounded text interaction
- OpenAI vector-store adapter for public knowledge retrieval
- OpenAI Realtime adapter for short-lived browser voice sessions
- Persistence adapters for conversations and leads
- GHL adapter behind `CRMGateway`
- Observability adapters for structured, redacted operational events

Adapters are added only when their delivery phase begins.
