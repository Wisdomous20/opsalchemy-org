# OPSAlchemy Development Roadmap

## Purpose

OPSAlchemy will be developed as a conversion-focused marketing website with a grounded AI assistant, browser-based voice interaction, a managed business knowledge base, and a future GoHighLevel (GHL) integration.

The implementation will follow clean architecture so that business rules remain independent of Next.js, OpenAI, databases, and third-party services. External systems will be integrated through explicit ports and replaceable adapters.

## Architecture Principles

### Dependency Direction

```text
Presentation
Next.js pages, components, forms, and API routes
        |
        v
Application
Chat, qualification, lead capture, and knowledge-search use cases
        |
        v
Domain
OPSAlchemy services, prospect profiles, recommendations, and business rules
        ^
        |
Infrastructure
OpenAI, vector stores, persistence, analytics, email, and GHL
```

Dependencies must point inward:

- The domain must not import Next.js, React, OpenAI, GHL, database clients, or environment variables.
- Application use cases coordinate business workflows through interfaces known as ports.
- Infrastructure adapters implement those ports for OpenAI, persistence, GHL, and other vendors.
- Presentation code validates and transforms requests, invokes application use cases, and formats responses.
- Route handlers and UI components must not contain business policy.
- Infrastructure failures must be translated into safe application errors before reaching the user.

### Proposed Repository Structure

```text
src/
|-- app/                         # Next.js routes and layouts
|-- components/
|   |-- marketing/
|   |-- assistant/
|   `-- ui/
|-- domain/
|   |-- services/
|   |-- prospects/
|   |-- conversations/
|   `-- leads/
|-- application/
|   |-- use-cases/
|   |-- ports/
|   `-- dto/
|-- infrastructure/
|   |-- openai/
|   |-- persistence/
|   |-- ghl/
|   `-- observability/
|-- server/
|   |-- composition/
|   |-- validation/
|   |-- security/
|   `-- config/
`-- content/
    `-- knowledge/
```

This structure is a target organization, not a requirement to create empty directories before they are needed. Modules should be introduced incrementally as each phase begins.

### Core Domain Concepts

- `ServiceOffering`
- `BusinessProblem`
- `ProspectProfile`
- `QualificationSession`
- `ServiceRecommendation`
- `KnowledgeCitation`
- `Conversation`
- `Lead`

### Application Ports

- `KnowledgeRepository`
- `AIConversationGateway`
- `ConversationRepository`
- `LeadRepository`
- `CRMGateway`
- `RealtimeSessionGateway`

The initial OpenAI and future GHL implementations will be infrastructure adapters behind these interfaces.

## Phase 0: Product and Architecture Foundation

### Goals

Establish the product boundaries, business language, engineering standards, security baseline, and architectural seams before implementing features.

### Deliverables

- Confirm the public website scope and desired conversion journey.
- Confirm that browser voice is the initial voice channel.
- Inventory, review, and approve existing OPSAlchemy content.
- Define assistant capabilities, restrictions, escalation rules, and tone.
- Identify which knowledge is public and which is internal.
- Record important architectural decisions.
- Establish typed environment-variable validation.
- Add linting, formatting, type checking, tests, and continuous integration.
- Create a safe `.env.example` containing placeholders only.
- Define privacy, consent, retention, and transcript-handling expectations.

### Exit Criteria

- Architecture and product boundaries are documented.
- Business rules can be tested without starting Next.js or calling OpenAI.
- No secrets are stored in source control or browser bundles.
- Continuous integration runs linting, type checking, and tests.
- Public and internal knowledge boundaries are explicitly defined.

## Phase 1: Marketing Website

### Goals

Rebuild the existing website as a polished, accessible, conversion-focused experience while retaining the OPSAlchemy brand and business positioning.

### Deliverables

- Responsive navigation
- Hero and value proposition
- Explanation of Operational Alchemy
- Six service offerings
- Problems OPSAlchemy solves
- Who OPSAlchemy serves
- People + Processes + Systems + Client Experience positioning
- Founder and team profiles
- Consultation call to action
- Mailing-list and contact experiences
- Social links and footer
- Privacy and cookie controls
- Search-engine and social-sharing metadata
- Analytics events for important calls to action

### Quality Requirements

- Responsive across mobile, tablet, and desktop breakpoints
- Keyboard-accessible navigation and controls
- Sufficient color contrast and readable typography
- Optimized images and stable layouts
- Semantic headings and meaningful alternative text
- Clear loading, empty, success, and error states for forms

### Exit Criteria

- The website reflects the OPSAlchemy brand and approved content.
- Core user journeys work without relying on AI features.
- Accessibility, performance, responsive behavior, and metadata have been verified.
- Contact and consultation actions work reliably.

## Phase 2: Grounded Text Assistant

### Goals

Introduce a text assistant that understands visitor problems, retrieves approved business knowledge, recommends suitable services, and guides qualified prospects toward a consultation.

### Application Use Cases

- `StartConversation`
- `AnswerBusinessQuestion`
- `QualifyProspect`
- `RecommendServices`
- `CaptureLead`
- `RequestHumanHandoff`

### Deliverables

- Website chat interface
- OpenAI Responses API adapter
- OpenAI file-search and vector-store adapter
- Approved OPSAlchemy knowledge ingestion
- Conversation persistence
- Source citations in assistant answers
- Prospect qualification workflow
- Service recommendation workflow
- Human handoff and lead-capture flow
- Rate limiting and abuse protection
- Structured, privacy-conscious logs
- Usage, latency, failure, and cost monitoring

### Assistant Behavior

- Understand the visitor's problem before recommending a service.
- Ask only the follow-up questions relevant to the conversation.
- Search approved OPSAlchemy material for business-specific answers.
- Cite the source material used to support an answer.
- Recommend one or two relevant services and explain the fit.
- Never invent pricing, guarantees, availability, or undocumented services.
- State clearly when the knowledge base does not contain an answer.
- Offer a consultation or human handoff when appropriate.
- Treat uploaded content and visitor messages as untrusted input.

### Exit Criteria

- Business-specific answers are grounded in approved knowledge.
- Citations are visible and traceable.
- Unsupported questions fail safely instead of producing fabricated answers.
- Prompt-injection, malformed-input, abuse, and rate-limit tests pass.
- Application tests can replace OpenAI with a deterministic fake adapter.

## Phase 3: Browser Voice Assistant

### Goals

Add real-time browser voice as another interface to the same qualification, knowledge, recommendation, and handoff capabilities used by text chat.

Voice must reuse the existing application layer rather than becoming an independent assistant implementation.

### Deliverables

- Microphone permission flow
- Start, mute, and end conversation controls
- Server-created OpenAI Realtime sessions
- Short-lived browser credentials
- Live transcript
- Spoken assistant responses
- Natural interruption handling
- Server-side knowledge-search tool calls
- Consistent qualification and recommendation behavior
- Text fallback
- Clear listening, thinking, speaking, disconnected, and error states
- Voice-session usage and latency monitoring

### Exit Criteria

- Permanent OpenAI credentials never reach the browser.
- Text and voice conversations follow the same business policies.
- Microphone denial and unsupported browsers are handled cleanly.
- Voice sessions can be ended reliably and release resources.
- Knowledge retrieval works without sending the complete knowledge base into every voice session.

## Phase 4: Knowledge Administration

### Goals

Allow authorized OPSAlchemy staff to maintain approved assistant knowledge without requiring a code deployment for every content change.

### Deliverables

- Protected administrator authentication
- Role-based authorization
- Document upload and validation
- File-size and file-type restrictions
- Document metadata, including title, category, audience, and effective date
- Draft, published, and archived knowledge states
- Vector-store ingestion and reindexing workflow
- Ingestion status and failure reporting
- Audit history for knowledge changes
- Separate public and internal knowledge collections

### Exit Criteria

- Anonymous users cannot access administration features.
- Files are validated at the authoritative server boundary.
- Knowledge changes are traceable to an authenticated administrator.
- Archived content is excluded from new assistant answers.
- Public assistant sessions cannot retrieve internal documents.

## Phase 5: GoHighLevel Integration

### Goals

Connect qualified and consenting prospects to GHL without coupling application rules to the GHL SDK or API schema.

The GHL adapter will implement the existing `CRMGateway` port.

### Potential Capabilities

- Create or update a contact
- Save prospect qualification results
- Record relevant service interests
- Apply approved tags
- Store a concise conversation summary
- Trigger GHL workflows
- Request a consultation
- Notify a human team member

### Security and Reliability Requirements

- Capture explicit visitor consent before sending personal data to GHL.
- Keep access tokens and location identifiers server-side.
- Validate and authenticate incoming webhooks.
- Make contact and workflow operations idempotent.
- Use bounded timeouts and retries for transient failures.
- Ensure GHL outages do not prevent visitors from using the website or assistant.
- Redact sensitive values from logs and client-facing errors.

### Exit Criteria

- Duplicate requests do not create duplicate contacts or workflow actions.
- Webhooks are verified and safe to retry.
- GHL failures degrade gracefully.
- Submitted information matches the visitor's consent.
- Integration behavior is covered by contract and application tests.

## Phase 6: Security and Launch Hardening

### Goals

Verify that the application is secure, observable, accessible, resilient, cost-controlled, and ready for production use.

### Deliverables

- Abuse and rate-limit testing
- Authentication and authorization review
- Input-validation review
- Prompt-injection and data-exposure evaluation
- Privacy and retention enforcement
- PII redaction in logs
- Safe client-facing errors
- Application and AI usage monitoring
- OpenAI budget alerts and cost controls
- Backup and recovery procedures
- Accessibility audit
- Performance and load testing
- Cross-browser and mobile testing
- Knowledge-answer evaluation suite
- Production deployment and rollback checklist
- Operational documentation

### Exit Criteria

- No critical security or privacy findings remain unresolved.
- Assistant evaluation results meet the agreed quality threshold.
- Monitoring and alerts cover failures, latency, abuse, and AI spending.
- The team can deploy, operate, troubleshoot, and roll back the application.
- Product, engineering, and business stakeholders approve production release.

## Testing Strategy

### Domain Unit Tests

Test business rules, qualification state transitions, and service recommendations without framework or network dependencies.

### Application Tests

Test use cases with fake implementations of knowledge, AI, persistence, CRM, and time-based ports.

### Adapter Contract Tests

Verify that OpenAI, vector-store, database, and GHL adapters correctly implement their application contracts and translate external failures.

### API Integration Tests

Cover request validation, authentication, authorization, rate limiting, object-level access, and safe error responses.

### Browser End-to-End Tests

Cover marketing navigation, forms, chat interaction, citations, lead capture, responsive behavior, and voice controls.

### AI Evaluations

Maintain a versioned evaluation set covering:

- Grounding in approved sources
- Citation correctness
- Service recommendation quality
- Appropriate qualification questions
- Refusal to invent undocumented information
- Public and internal knowledge separation
- Prompt-injection resistance
- Human-handoff behavior

## Cross-Cutting Security Requirements

- Treat browser input, uploaded files, webhook payloads, and third-party responses as untrusted.
- Validate type, size, shape, and business invariants on the server.
- Store secrets only in server-side environment variables or an approved secret manager.
- Apply least privilege to OpenAI, database, storage, and GHL credentials.
- Store the minimum personal information required for the approved workflow.
- Do not return raw upstream errors, tokens, stack traces, or internal identifiers to clients.
- Use parameterized persistence APIs and context-appropriate output encoding.
- Apply authentication, authorization, auditing, and rate limiting where required.
- Make external side effects idempotent and safe to retry.

## Recommended Delivery Order

Work should proceed in this order:

1. Product and architecture foundation
2. Marketing website
3. Grounded text assistant
4. Browser voice assistant
5. Knowledge administration
6. GHL integration
7. Security and launch hardening

GHL is deliberately deferred, but its application port is defined early so the integration can be added without changing qualification or lead-capture business rules.
