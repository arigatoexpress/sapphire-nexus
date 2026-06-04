# Sapphire Nexus

Local-first intelligence kernel for AI, quant research, and runtime evidence. A Hono/TypeScript API with a first-screen operator workbench, source-rights-aware landscape catalog, and local model gateway contracts.

## What this does

Nexus turns AI, quant, trading-research, and runtime context into typed intelligence products. It provides a clean operator workbench, public API contracts, and adapter readiness checks — all with risky lanes disabled by default.

## Quick start

```bash
npm install
npm run verify
npm run dev
```

Default URL: `http://127.0.0.1:4420`

**Production smoke:**
```bash
npm run smoke:production -- https://your-deployment-url
```

## Architecture

```
Operator Workbench  ◄──►  Hono API  ◄──►  Adapters (repo-mining, trending-signals,
                                              public-sources, model-gateway, AOE,
                                              agent-runtime publication)
```

Public deployments should set `SAPPHIRE_NEXUS_PUBLIC_MODE=true`. Public mode disables private local adapter probes (Ollama, Windows GPU, AOE, agent-runtime) and returns hardening headers on every route.

## Key features

- **Operator workbench** — first-screen readiness rollup with evidence ledger and landscape catalog
- **Typed API contracts** — OpenAPI 3.1, `llms.txt`, and `.well-known/sapphire-nexus.json`
- **Adapter readiness** — repo-mining, trending-signals, public-sources, model-gateway, AOE, agent-runtime
- **Local model gateway** — Ollama contracts with prompt-smoke disabled by default
- **Source-rights aware** — stores metadata, hashes, summaries, and provenance; never raw private payloads
- **Safety-first** — live trading, Telegram sends, wallet signing, and secret handling are all disabled by default

## Tech stack

- Node.js ≥ 22
- TypeScript 5.9+
- Hono
- Vitest
- Vercel / Cloud Run / Docker

## Core routes

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness check |
| `GET /v1/readiness` | Full operator status envelope |
| `GET /v1/landscape` | Source-rights-aware landscape catalog |
| `GET /v1/evidence-ledger` | Hash-addressed evidence records |
| `GET /v1/model-gateway` | Local model gateway contract |
| `GET /v1/deployment` | Safe deployment identity |
| `GET /v1/client/claim-readiness` | Freshness and revision gates for client-current claims |
| `GET /v1/data/review-queue` | Source-rights review queue for stale checked-in metadata |
| `GET /openapi.json` | OpenAPI 3.1 contract |

## Agent collaborators

See [AGENTS.md](AGENTS.md) for hard stops, build rules, and adapter conventions.

## License

MIT
