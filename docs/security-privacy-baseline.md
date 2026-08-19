# Security and Privacy Baseline

## Secrets

- Store secrets in root-level ignored environment files during local development and in the deployment platform's secret manager in hosted environments.
- Never prefix server credentials with `NEXT_PUBLIC_`.
- Never log credentials or return them in client errors.
- Use a dedicated OpenAI project key and rotate it if exposure is suspected.
- Validate required configuration when a server-only integration is initialized.

## Public Input

- Treat all browser input and model output as untrusted.
- Validate request shape, type, length, and allowed values on the server.
- Add request-size limits and rate limiting before public AI routes launch.
- Encode rendered output for its destination and do not render raw model HTML.

## AI and Knowledge

- Keep public and internal knowledge stores separate.
- Treat retrieved documents as data, not executable instructions.
- Require citations for business-specific claims.
- Fail safely when approved knowledge does not establish an answer.
- Maintain evaluation cases for prompt injection and data extraction attempts.

## Personal Information

- Collect only information needed for consultation or follow-up.
- Obtain explicit consent before syncing a lead to GHL.
- Define retention periods before conversation persistence launches.
- Redact email addresses, phone numbers, message content, and external tokens from routine logs.

## Integrations

- Keep OpenAI and GHL calls server-side.
- Browser voice may connect directly to OpenAI over WebRTC only with a short-lived
  client secret minted by the server; permanent project credentials must never enter
  the browser bundle or API response.
- Give service accounts the least permissions required.
- Apply bounded timeouts and retries.
- Make webhook and CRM side effects idempotent.
- Verify webhook authenticity where supported.
- Translate upstream errors into safe client-facing messages.

## Pre-Launch Requirements

Authentication, authorization, rate limiting, audit logging, retention enforcement, incident response, and dependency review must be completed in the phases where the relevant attack surface is introduced.
