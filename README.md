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
