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
- `GET /v1/evidence-ledger`
- `GET /v1/adapters/aoe/readiness`
- `GET /v1/model-gateway`
- `GET /v1/model-gateway/readiness`
- `GET /v1/market/research-posture`

## Safety Posture

All risky lanes are disabled by default: live trading, money movement, wallet
signing, Telegram sends, customer sends, secret handling, and production
infrastructure mutation.

`GET /v1/model-gateway/readiness` performs health-only readbacks against the
configured local model gateways. It does not send prompts, start training, read
secrets, or mutate runtimes.

`GET /v1/evidence-ledger` turns the landscape catalog into stable, hash-addressed
evidence records. It stores links, source ids, rights metadata, summaries, and
hashes; it does not store raw private payloads.

`GET /v1/adapters/aoe/readiness` reads AOE's public health, discovery,
readiness, and contract endpoints and keeps only summaries. It does not settle
payments, unlock paid content, send Telegram messages, or store raw contract
bundles.
