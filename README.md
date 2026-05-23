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

## Production

The public deployment entrypoint is `api/index.ts`, with Vercel routing all
paths through the Hono app. Public deployments should set
`SAPPHIRE_NEXUS_PUBLIC_MODE=true`; Vercel also sets `VERCEL=1`, which activates
the same public-safe behavior automatically.

Public mode disables private local adapter probes for Ollama, Windows GPU, AOE,
and agent-runtime-control-plane. The deployed workbench still renders the
readiness rollup, but local-only checks are marked `disabled` instead of trying
to reach private infrastructure from production.

After deploy, run:

```bash
npm run smoke:production -- https://your-deployment-url
```

For Cloud Run, the app uses `PORT` and binds to `0.0.0.0` when `K_SERVICE` is
present. The checked-in `Dockerfile` sets `SAPPHIRE_NEXUS_PUBLIC_MODE=true` so
the service exposes the public workbench and contracts without probing private
local infrastructure.

## Core Routes

- `GET /`
- `GET /health`
- `GET /.well-known/sapphire-nexus.json`
- `GET /v1/thesis`
- `GET /v1/landscape`
- `GET /v1/readiness`
- `GET /v1/evidence-ledger`
- `GET /v1/adapters/aoe/readiness`
- `GET /v1/adapters/agent-runtime/publication`
- `GET /v1/model-gateway`
- `GET /v1/model-gateway/readiness`
- `GET /v1/model-gateway/prompt-smoke`
- `GET /v1/market/research-posture`

## Safety Posture

All risky lanes are disabled by default: live trading, money movement, wallet
signing, Telegram sends, customer sends, secret handling, and production
infrastructure mutation.

`GET /v1/model-gateway/readiness` performs health-only readbacks against the
configured local model gateways. It does not send prompts, start training, read
secrets, or mutate runtimes.

`GET /v1/readiness` rolls core health, evidence, model gateway, prompt smoke,
AOE, and agent-runtime publication checks into one operator status envelope. It
keeps per-check details summary-only and does not store raw payloads.

`GET /v1/model-gateway/prompt-smoke` is disabled by default. When
`SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED=true` and
`SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL` is set, it sends one fixed health-check
prompt to local Ollama and returns only status, hashes, booleans, and lengths.
It does not return or store prompt text, completion text, user prompts, cloud
fallbacks, training jobs, or runtime mutations.

`GET /v1/evidence-ledger` turns the landscape catalog into stable, hash-addressed
evidence records. It stores links, source ids, rights metadata, summaries, and
hashes; it does not store raw private payloads.

`GET /v1/adapters/aoe/readiness` reads AOE's public health, discovery,
readiness, and contract endpoints and keeps only summaries. It does not settle
payments, unlock paid content, send Telegram messages, or store raw contract
bundles.

`GET /v1/adapters/agent-runtime/publication` runs the control plane's
publication-plan script and returns a summary of tracked-source readiness,
generated-output exclusion, and visibility gates. It does not read generated
payload contents, broaden permissions, publish repos, or mutate runtimes.
