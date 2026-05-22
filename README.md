# Sapphire Nexus

Sapphire Nexus is a clean, local-first intelligence kernel for Ari's AI, quant,
trading-research, and runtime-control work. It is intentionally not a rewrite of
every old Sapphire surface. It mines useful contracts and ideas, then exposes a
small typed API and operator workbench.

## What It Is

- A Hono/TypeScript API with typed contracts.
- A first-screen operator workbench.
- A source-rights-aware landscape catalog.
- A local model gateway contract for Ollama now and Windows GPU serving later.
- A paper-only market research posture.

## What It Is Not

- Not THO / Project-Go-Forward.
- Not a live trading system.
- Not a Telegram sender.
- Not a wallet signer or payment settlement service.
- Not a place to dump raw generated agent logs.

## Quick Start

```bash
npm install
npm run verify
npm run dev
```

Default URL: `http://127.0.0.1:4420`.

## Core Routes

- `GET /`
- `GET /health`
- `GET /.well-known/sapphire-nexus.json`
- `GET /v1/thesis`
- `GET /v1/landscape`
- `GET /v1/model-gateway`
- `GET /v1/market/research-posture`

## Safety Posture

All risky lanes are disabled by default: live trading, money movement, wallet
signing, Telegram sends, customer sends, secret handling, and production
infrastructure mutation.

