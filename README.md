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

All public responses include basic hardening headers for content sniffing,
referrer leakage, framing, cross-origin opener isolation, and browser
permissions. Production smoke validates the core header set on every checked
route.

After deploy, run:

```bash
npm run smoke:production -- https://your-deployment-url
```

When checking a specific Cloud Run revision, pass the revision observed from
`gcloud run services describe` so smoke fails if the public deployment identity
does not match:

```bash
SAPPHIRE_NEXUS_EXPECTED_REVISION=sapphire-nexus-00008-r46 npm run smoke:production -- https://your-deployment-url
```

For Cloud Run, the app uses `PORT` and binds to `0.0.0.0` when `K_SERVICE` is
present. The checked-in `Dockerfile` sets `SAPPHIRE_NEXUS_PUBLIC_MODE=true` so
the service exposes the public workbench and contracts without probing private
local infrastructure.

## Core Routes

- `GET /`
- `GET /health`
- `GET /.well-known/sapphire-nexus.json`
- `GET /openapi.json`
- `GET /llms.txt`
- `GET /robots.txt`
- `GET /v1/deployment`
- `GET /v1/client/brief`
- `GET /v1/verification-manifest`
- `GET /v1/thesis`
- `GET /v1/landscape`
- `GET /v1/readiness`
- `GET /v1/evidence-ledger`
- `GET /v1/adapters/repo-mining/readiness`
- `GET /v1/adapters/public-sources/readiness`
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

`GET /v1/readiness` rolls core health, evidence, repo-mining, public-source,
model gateway, prompt smoke, AOE, and agent-runtime publication checks into one
operator status envelope. It keeps per-check details summary-only and does not
store raw payloads.

`GET /v1/model-gateway/prompt-smoke` is disabled by default. When
`SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED=true` and
`SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL` is set, it sends one fixed health-check
prompt to local Ollama and returns only status, hashes, booleans, and lengths.
It does not return or store prompt text, completion text, user prompts, cloud
fallbacks, training jobs, or runtime mutations.

`GET /v1/evidence-ledger` turns the landscape catalog into stable, hash-addressed
evidence records. It stores links, source ids, rights metadata, summaries, and
hashes; it does not store raw private payloads.

`GET /v1/deployment` exposes a safe deployment identity for operators:
origin, provider, Cloud Run service/revision metadata when present, public mode,
and the production verification checklist. It does not dump environment
variables, read secrets, mutate infrastructure, or broaden permissions.

`GET /openapi.json` exposes a small OpenAPI 3.1 contract for the read-only
public API. It lists the public JSON routes, schema ids, and the disabled
live-action posture so clients and agents can integrate without scraping the
workbench.

`GET /v1/adapters/public-sources/readiness` summarizes the public open-source
shortlist as a rights-cleared adapter. It classifies permissive references,
copyleft/reference-only sources, and sources needing review without fetching
remote payloads, vendoring code, or making license override claims.

`GET /v1/adapters/repo-mining/readiness` summarizes Ari-owned repo-mining
signals from checked-in landscape metadata. It exposes repo links, mining
intent, avoidance guidance, rights envelopes, and stable hashes only. It does
not fetch remote repositories, vendor source code, delete source repos, broaden
permissions, or collapse protected products into Nexus.

`GET /llms.txt` and `GET /robots.txt` expose public metadata for AI agents,
crawlers, and operators. They summarize the public routes, source-rights
posture, and hard safety boundaries without exposing private data or local
adapter details.

`GET /v1/adapters/aoe/readiness` reads AOE's public health, discovery,
readiness, and contract endpoints and keeps only summaries. It does not settle
payments, unlock paid content, send Telegram messages, or store raw contract
bundles.

When AOE is disabled or unreachable, Nexus returns an `operatorHint` with the
expected base URL and `autoStart=false`. Nexus does not start, deploy, or mutate
AOE for you; run AOE separately and point `SAPPHIRE_NEXUS_AOE_URL` at its
read-only contract surface.

`GET /v1/adapters/agent-runtime/publication` runs the control plane's
publication-plan script and returns a summary of tracked-source readiness,
generated-output exclusion, and visibility gates. It does not read generated
payload contents, broaden permissions, publish repos, or mutate runtimes.
