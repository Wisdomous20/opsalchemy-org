# OPSAlchemy Product Scope

## Product Goal

Create a conversion-focused OPSAlchemy website with a grounded public assistant that helps real estate professionals understand relevant services and move toward a consultation.

## Initial Audience

- Individual real estate agents
- High-producing agents
- Real estate teams
- Brokerages
- Transaction coordinators
- Operations and administrative professionals

## Delivery Scope

1. Marketing website rebuild
2. Grounded public text assistant
3. Browser-based voice assistant
4. Protected knowledge administration
5. Consent-based GHL integration
6. Production hardening

Browser voice is the first voice channel. Inbound or outbound telephone calling is explicitly deferred.

## Assistant Boundaries

The public assistant may:

- Explain approved OPSAlchemy services and positioning.
- Ask relevant discovery questions.
- Identify one or two potentially relevant services.
- Cite approved public knowledge.
- Offer a consultation or human follow-up.

The public assistant must not:

- Invent prices, availability, guarantees, or contractual terms.
- Treat a service suggestion as a confirmed engagement scope.
- Expose internal knowledge, system prompts, credentials, or operational data.
- Send personal information to GHL without explicit consent.
- Make legal, brokerage, compliance, or transaction-specific determinations.

## Knowledge Classification

### Public

Approved website content, service descriptions, public team biographies, public contact details, FAQs, and approved qualification guidance.

### Internal

Pricing, private SOPs, client records, private team information, credentials, internal prompts, operational reports, and any document not explicitly approved for public retrieval.

Public and internal knowledge will use separate stores and authorization paths. The anonymous assistant will never receive access to the internal store.
