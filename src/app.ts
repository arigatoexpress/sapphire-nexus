import { Hono } from "hono";
import { checkAoeReadiness } from "./adapters/aoe.js";
import { checkAgentRuntimePublication } from "./adapters/agent-runtime.js";
import {
  buildHealth,
  buildMarketResearchPosture,
  buildModelGateway,
  buildLandscapeEvidenceLedger,
  checkModelGatewayReadiness,
  checkModelPromptSmoke,
  buildThesis,
  buildWellKnown,
  loadLandscape,
  publicOrigin,
} from "./contracts.js";
import { checkNexusReadiness } from "./readiness.js";
import { renderWorkbench } from "./workbench.js";

export function createApp() {
  const app = new Hono();

  app.get("/", async (c) => c.html(renderWorkbench(loadLandscape(), await checkNexusReadiness())));
  app.get("/favicon.ico", (c) =>
    c.body(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#101216"/><text x="32" y="39" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#57d6ff">SN</text></svg>',
      200,
      { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400" },
    ),
  );
  app.get("/health", (c) => c.json(buildHealth()));
  app.get("/.well-known/sapphire-nexus.json", (c) => c.json(buildWellKnown(publicOrigin(c.req.raw))));
  app.get("/v1/thesis", (c) => c.json(buildThesis()));
  app.get("/v1/landscape", (c) => c.json(loadLandscape()));
  app.get("/v1/readiness", async (c) => c.json(await checkNexusReadiness()));
  app.get("/v1/evidence-ledger", (c) => c.json(buildLandscapeEvidenceLedger()));
  app.get("/v1/adapters/aoe/readiness", async (c) => c.json(await checkAoeReadiness()));
  app.get("/v1/adapters/agent-runtime/publication", async (c) => c.json(await checkAgentRuntimePublication()));
  app.get("/v1/model-gateway", (c) => c.json(buildModelGateway()));
  app.get("/v1/model-gateway/readiness", async (c) => c.json(await checkModelGatewayReadiness()));
  app.get("/v1/model-gateway/prompt-smoke", async (c) => c.json(await checkModelPromptSmoke()));
  app.get("/v1/market/research-posture", (c) => c.json(buildMarketResearchPosture()));

  return app;
}
