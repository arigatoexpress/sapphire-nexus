import { buildSafetyBoundary, buildWellKnown } from "./contracts.js";

export function buildOpenApiSpec(origin: string) {
  const discovery = buildWellKnown(origin);
  const safety = buildSafetyBoundary();
  return {
    openapi: "3.1.0",
    info: {
      title: "Sapphire Nexus API",
      version: "0.1.0",
      summary: "Read-only public contracts for Sapphire Nexus.",
      description:
        "Sapphire Nexus exposes operator-ready metadata, readiness, evidence, and source-rights contracts. Live actions remain disabled.",
    },
    servers: [{ url: origin }],
    "x-sapphire-nexus": {
      service: discovery.service,
      schemaId: "sapphire.nexus.openapi.v1",
      liveActionsEnabled: false,
      safety,
    },
    paths: Object.fromEntries(
      [
        route("health", discovery.routes.health, "Core health", discovery.schemaIds.health),
        route("deployment", discovery.routes.deployment, "Safe deployment identity", discovery.schemaIds.deployment),
        route("dataFreshness", discovery.routes.dataFreshness, "Checked-in data freshness", discovery.schemaIds.dataFreshness),
        route("dataRefreshPlan", discovery.routes.dataRefreshPlan, "Metadata refresh plan", discovery.schemaIds.dataRefreshPlan),
        route(
          "metadataRefreshArtifact",
          discovery.routes.metadataRefreshArtifact,
          "Metadata refresh review artifact",
          discovery.schemaIds.metadataRefreshArtifact,
        ),
        route("dataReviewQueue", discovery.routes.dataReviewQueue, "Metadata review queue", discovery.schemaIds.dataReviewQueue),
        route("clientDemo", discovery.routes.clientDemo, "Client-safe demo flow", discovery.schemaIds.clientDemo),
        route(
          "clientClaimReadiness",
          discovery.routes.clientClaimReadiness,
          "Client claim readiness gates",
          discovery.schemaIds.clientClaimReadiness,
        ),
        route("clientBrief", discovery.routes.clientBrief, "Client-safe production brief", discovery.schemaIds.clientBrief),
        route(
          "verificationManifest",
          discovery.routes.verificationManifest,
          "Public production verification manifest",
          discovery.schemaIds.verificationManifest,
        ),
        route("discovery", "/.well-known/sapphire-nexus.json", "Machine-readable route discovery", discovery.schemaId),
        route("thesis", discovery.routes.thesis, "Product thesis and protected boundaries", discovery.schemaIds.thesis),
        route("landscape", discovery.routes.landscape, "Rights-aware landscape catalog", discovery.schemaIds.landscape),
        route("readiness", discovery.routes.readiness, "Readiness rollup", discovery.schemaIds.readiness),
        route("evidenceLedger", discovery.routes.evidenceLedger, "Stable evidence ledger", discovery.schemaIds.evidenceLedger),
        route(
          "repoMiningReadiness",
          discovery.routes.repoMiningReadiness,
          "Owned-repo mining readiness",
          discovery.schemaIds.repoMiningReadiness,
        ),
        route(
          "trendingSignalsReadiness",
          discovery.routes.trendingSignalsReadiness,
          "Checked-in trending signals readiness",
          discovery.schemaIds.trendingSignalsReadiness,
        ),
        route(
          "publicSourcesReadiness",
          discovery.routes.publicSourcesReadiness,
          "Public-source rights readiness",
          discovery.schemaIds.publicSourcesReadiness,
        ),
        route("aoeReadiness", discovery.routes.aoeReadiness, "AOE adapter readiness", discovery.schemaIds.aoeReadiness),
        route(
          "agentRuntimePublication",
          discovery.routes.agentRuntimePublication,
          "Agent-runtime publication adapter",
          discovery.schemaIds.agentRuntimePublication,
        ),
        route("modelGateway", discovery.routes.modelGateway, "Local model gateway contract", discovery.schemaIds.modelGateway),
        route(
          "modelGatewayReadiness",
          discovery.routes.modelGatewayReadiness,
          "Model gateway readiness",
          discovery.schemaIds.modelGatewayReadiness,
        ),
        route(
          "modelPromptSmoke",
          discovery.routes.modelPromptSmoke,
          "No-storage local prompt smoke",
          discovery.schemaIds.modelPromptSmoke,
        ),
        route(
          "marketResearchPosture",
          discovery.routes.marketResearchPosture,
          "Research-only market posture",
          discovery.schemaIds.marketResearchPosture,
        ),
        route(
          "operatorNextActions",
          discovery.routes.operatorNextActions,
          "Operator next actions and Ari-only decisions",
          discovery.schemaIds.operatorNextActions,
        ),
      ].map((entry) => [entry.path, entry.spec]),
    ),
  };
}

function route(operationId: string, path: string, summary: string, schemaId: string) {
  return {
    path,
    spec: {
      get: {
        operationId,
        summary,
        responses: {
          "200": {
            description: `${summary} response`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schemaId: { const: schemaId },
                  },
                  additionalProperties: true,
                },
              },
            },
          },
        },
        "x-live-actions-enabled": false,
      },
    },
  };
}
