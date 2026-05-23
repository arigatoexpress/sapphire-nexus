import { Hono } from "hono";
import { checkAoeReadiness } from "./adapters/aoe.js";
import { checkAgentRuntimePublication } from "./adapters/agent-runtime.js";
import { buildPublicSourcesReadiness } from "./adapters/public-sources.js";
import { buildRepoMiningReadiness } from "./adapters/repo-mining.js";
import { buildTrendingSignalsReadiness } from "./adapters/trending-signals.js";
import {
  buildHealth,
  buildClientBrief,
  buildMarketResearchPosture,
  buildModelGateway,
  buildOperatorNextActions,
  buildLandscapeEvidenceLedger,
  buildVerificationManifest,
  checkModelGatewayReadiness,
  checkModelPromptSmoke,
  buildThesis,
  buildWellKnown,
  loadLandscape,
  publicOrigin,
} from "./contracts.js";
import { buildDeploymentIdentity } from "./deployment.js";
import { buildDataFreshness } from "./freshness.js";
import { buildOpenApiSpec } from "./openapi.js";
import { buildLlmsTxt, buildRobotsTxt } from "./public-metadata.js";
import { checkNexusReadiness } from "./readiness.js";
import { PUBLIC_RESPONSE_HEADERS } from "./response-headers.js";
import { renderWorkbench } from "./workbench.js";

export function createApp() {
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    for (const [name, value] of Object.entries(PUBLIC_RESPONSE_HEADERS)) {
      c.header(name, value);
    }
  });

  app.get("/", async (c) => {
    const origin = publicOrigin(c.req.raw);
    return c.html(renderWorkbench(loadLandscape(), await checkNexusReadiness(), buildDeploymentIdentity(origin)));
  });
  app.get("/favicon.ico", (c) =>
    c.body(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#101216"/><text x="32" y="39" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#57d6ff">SN</text></svg>',
      200,
      { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400" },
    ),
  );
  app.get("/health", (c) => c.json(buildHealth()));
  app.get("/.well-known/sapphire-nexus.json", (c) => c.json(buildWellKnown(publicOrigin(c.req.raw))));
  app.get("/openapi.json", (c) => c.json(buildOpenApiSpec(publicOrigin(c.req.raw))));
  app.get("/llms.txt", (c) =>
    c.text(buildLlmsTxt(publicOrigin(c.req.raw)), 200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    }),
  );
  app.get("/robots.txt", (c) =>
    c.text(buildRobotsTxt(publicOrigin(c.req.raw)), 200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    }),
  );
  app.get("/v1/thesis", (c) => c.json(buildThesis()));
  app.get("/v1/client/brief", (c) => c.json(buildClientBrief(publicOrigin(c.req.raw))));
  app.get("/v1/deployment", (c) => c.json(buildDeploymentIdentity(publicOrigin(c.req.raw))));
  app.get("/v1/data/freshness", (c) => c.json(buildDataFreshness(publicOrigin(c.req.raw))));
  app.get("/v1/verification-manifest", (c) => c.json(buildVerificationManifest(publicOrigin(c.req.raw))));
  app.get("/v1/landscape", (c) => c.json(loadLandscape()));
  app.get("/v1/readiness", async (c) => c.json(await checkNexusReadiness()));
  app.get("/v1/evidence-ledger", (c) => c.json(buildLandscapeEvidenceLedger()));
  app.get("/v1/adapters/repo-mining/readiness", (c) => c.json(buildRepoMiningReadiness()));
  app.get("/v1/adapters/trending-signals/readiness", (c) => c.json(buildTrendingSignalsReadiness()));
  app.get("/v1/adapters/public-sources/readiness", (c) => c.json(buildPublicSourcesReadiness()));
  app.get("/v1/adapters/aoe/readiness", async (c) => c.json(await checkAoeReadiness()));
  app.get("/v1/adapters/agent-runtime/publication", async (c) => c.json(await checkAgentRuntimePublication()));
  app.get("/v1/model-gateway", (c) => c.json(buildModelGateway()));
  app.get("/v1/model-gateway/readiness", async (c) => c.json(await checkModelGatewayReadiness()));
  app.get("/v1/model-gateway/prompt-smoke", async (c) => c.json(await checkModelPromptSmoke()));
  app.get("/v1/market/research-posture", (c) => c.json(buildMarketResearchPosture()));
  app.get("/v1/operator/next-actions", (c) => c.json(buildOperatorNextActions()));

  return app;
}
