export function buildLlmsTxt(origin: string) {
  return `# Sapphire Nexus

> Local-first intelligence kernel for Ari's AI, quant-research, market-research, and runtime evidence.

Public URL: ${origin}
Status: read-only public surface; live actions disabled.

## Primary Routes

- GET /health
- GET /.well-known/sapphire-nexus.json
- GET /openapi.json
- GET /v1/deployment
- GET /v1/data/freshness
- GET /v1/data/refresh-plan
- GET /v1/client/demo
- GET /v1/client/brief
- GET /v1/verification-manifest
- GET /v1/readiness
- GET /v1/evidence-ledger
- GET /v1/adapters/repo-mining/readiness
- GET /v1/adapters/trending-signals/readiness
- GET /v1/adapters/public-sources/readiness
- GET /v1/landscape
- GET /v1/market/research-posture
- GET /v1/operator/next-actions

## Safety Boundaries

- No live trading, money movement, payment settlement, wallet signing, Telegram/customer sends, secret handling, or production infra mutation.
- THO / Project-Go-Forward is out of scope.
- Public deployments disable local-only adapter probes rather than reaching private infrastructure.

## Source Rights

Nexus publishes derived summaries, links, hashes, provenance, and readiness metadata. It does not publish raw private payload dumps.
`;
}

export function buildRobotsTxt(origin: string) {
  return `User-agent: *
Allow: /

llms.txt: ${origin}/llms.txt
`;
}
