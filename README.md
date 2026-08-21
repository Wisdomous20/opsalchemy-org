# OPSAlchemy

OPSAlchemy is a Next.js application for a conversion-focused marketing website, grounded AI assistant, browser voice experience, managed business knowledge, and future GoHighLevel integration.

## Requirements

- Node.js 20 or later
- npm
- An OpenAI project key and vector store for AI phases

## Local Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env.local` and replace placeholders with local secrets. Do not commit local environment files.

3. Start the development server:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Quality Commands

```powershell
npm run lint
npm run typecheck
npm run format:check
npm run test:ci
npm run build
```

Run all non-build quality checks with:

```powershell
npm run check
```

## Architecture

The application uses clean dependency boundaries:

- `src/domain`: OPSAlchemy business concepts and rules
- `src/application`: use cases and provider-neutral ports
- `src/infrastructure`: external-service adapters added by delivery phase
- `src/app` and `src/components`: Next.js presentation
- `src/server`: server-only configuration and dependency composition

See [Architecture](docs/architecture.md), [Product Scope](docs/product-scope.md), [Security and Privacy Baseline](docs/security-privacy-baseline.md), and the [Development Roadmap](docs/development-roadmap.md).

## Knowledge

Approved public knowledge prepared for OpenAI File Search is stored in `knowledge/`. Public and internal knowledge must remain separate.

## Assistant Interfaces

- Text chat uses the server-side Responses API adapter and approved vector-store search.
- Browser voice uses WebRTC with a short-lived OpenAI Realtime client secret minted by
  `/api/realtime/session`.
- Voice knowledge calls pass through `/api/realtime/tool` and reuse the same grounded
  application use case as text chat.
- The permanent OpenAI project key remains server-only. Voice sessions release the
  microphone and peer connection when ended or disconnected.

## Personal Google Calendar Scheduling

The text and voice assistants can schedule consultations on one personal Google
Calendar. They collect the visitor's name, email, exact time, and time zone, require
explicit confirmation, check free/busy, and then create a Google Meet event. Google
Calendar sends the attendee invitation as the confirmation email.

Consultation requests also require a mobile number with country code and permission
for OPSAlchemy to save the contact details and follow up about the consultation. The
lead is saved before the calendar event is created. The local lead ledger is disabled
in production until administrator authentication is implemented.

Consultations use fixed one-hour slots in UTC+8. The assistant checks the connected
calendar and offers only available start times from 8:00 AM through 4:00 PM, with the
last consultation ending at 5:00 PM.

To enable scheduling:

1. Enable the Google Calendar API in a Google Cloud project and configure its OAuth
   consent screen for the calendar owner's Google account.
2. Create an OAuth web client and authorize that account with offline access and these
   scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.freebusy`
3. Put the resulting client ID, client secret, and refresh token in `.env.local` using
   the `GOOGLE_*` names from `.env.example`. Keep `GOOGLE_CALENDAR_ID=primary` to use
   the authorized account's primary calendar.

Never commit the OAuth client secret or refresh token. If the OAuth consent screen is
left in Google Cloud's testing status, Google may issue a short-lived refresh token;
use the appropriate production consent configuration before deployment.
