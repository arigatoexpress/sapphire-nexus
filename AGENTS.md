# Sapphire Nexus — Agent Guidelines

## What this repo does

Local-first intelligence kernel for AI, quant research, and runtime evidence. It replaces scattered Sapphire-era experiments with one small, source-rights-aware, typed API and operator workbench.

## Key directories and files

| Path | Purpose |
|------|---------|
| `src/server.ts` | Entrypoint |
| `src/app.ts` | Hono app, route wiring, middleware |
| `src/workbench.ts` | Operator workbench HTML/template |
| `src/contracts.ts` | Typed contracts and registry |
| `src/openapi.ts` | OpenAPI 3.1 schema generation |
| `src/adapters/` | Adapter modules: repo-mining, trending-signals, public-sources, model-gateway, AOE, agent-runtime |
| `src/*.ts` | Feature modules: readiness, landscape, evidence, freshness, deployment, client-demo, etc. |
| `tests/` | Vitest tests |
| `api/index.ts` | Vercel serverless entrypoint |
| `scripts/` | Production smoke and helper scripts |

## How to run tests / dev server

```bash
npm run dev            # tsx watch src/server.ts
npm run verify         # typecheck + test + build
npm test               # vitest run
npm run typecheck      # tsc --noEmit
npm run build          # compile to dist/
npm run smoke:production -- <url>  # deployed smoke tests
```

## Safety boundaries

- Do not touch THO, Project-Go-Forward, or TexasHomeOutlet assets from this repo.
- Do not execute live trades, payment settlement, wallet signing, or money movement.
- Do not send Telegram, social, email, or customer messages.
- Do not expose, copy, rotate, or embed secrets.
- Do not delete source repos, production data, DNS, GCP projects, Firestore, GCS, or runtime assets.
- Do not broaden repository, cloud, machine, or account permissions without an explicit prepared plan.

## Build rules

- Use small typed contracts and tests before adding adapters.
- Store derived metadata, links, hashes, summaries, and provenance — not raw private payloads.
- Treat market outputs as research context, never investment advice or execution.
- Keep the first screen operational and data-backed, not a landing page.

## Current status

Active development. Core workbench, contracts, and adapters are tested and deployed. New adapters require tests and contract updates.
