import { Hono } from "hono";
import { checkAoeReadiness } from "./adapters/aoe.js";
import { checkAgentRuntimePublication } from "./adapters/agent-runtime.js";
import {
  buildHealth,
  buildMarketResearchPosture,
  buildModelGateway,
  buildLandscapeEvidenceLedger,
  checkModelGatewayReadiness,
  buildThesis,
  buildWellKnown,
  loadLandscape,
  publicOrigin,
} from "./contracts.js";
import { renderWorkbench } from "./workbench.js";

export function createApp() {
  const app = new Hono();

  app.get("/", (c) => c.html(renderWorkbench(loadLandscape())));
  app.get("/health", (c) => c.json(buildHealth()));
  app.get("/.well-known/sapphire-nexus.json", (c) => c.json(buildWellKnown(publicOrigin(c.req.raw))));
  app.get("/v1/thesis", (c) => c.json(buildThesis()));
  app.get("/v1/landscape", (c) => c.json(loadLandscape()));
  app.get("/v1/evidence-ledger", (c) => c.json(buildLandscapeEvidenceLedger()));
  app.get("/v1/adapters/aoe/readiness", async (c) => c.json(await checkAoeReadiness()));
  app.get("/v1/adapters/agent-runtime/publication", async (c) => c.json(await checkAgentRuntimePublication()));
  app.get("/v1/model-gateway", (c) => c.json(buildModelGateway()));
  app.get("/v1/model-gateway/readiness", async (c) => c.json(await checkModelGatewayReadiness()));
  app.get("/v1/market/research-posture", (c) => c.json(buildMarketResearchPosture()));

  return app;
}
