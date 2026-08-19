# ADR 0001: Modular Monolith With Clean Architecture

- Status: Accepted
- Date: 2026-08-19

## Context

OPSAlchemy needs a marketing site, grounded AI chat, browser voice, knowledge administration, persistence, and a future GHL integration. The initial team and operational scope do not justify separately deployed services, but direct coupling to Next.js or vendor SDKs would make later changes difficult and unsafe.

## Decision

Build one Next.js deployable application organized into domain, application, infrastructure, presentation, and composition boundaries.

Application capabilities that cross a vendor boundary are expressed as ports. OpenAI, persistence, and GHL integrations implement those ports as infrastructure adapters. Domain and application code remain independently testable without a framework, network, or database.

## Consequences

### Positive

- Simple initial deployment and operations
- Explicit vendor boundaries
- Fast unit tests for business behavior
- Future GHL integration does not change qualification rules
- Framework upgrades are less likely to affect core policy

### Tradeoffs

- Requires discipline around dependency direction
- Adds small interface and composition overhead
- Does not independently scale components until a demonstrated need justifies extraction

## Enforcement

- ESLint import restrictions for domain and application layers
- Tests that use fake ports instead of external services
- Architecture review for new cross-layer dependencies
- Server-only modules for credentials and concrete adapter composition
