import { describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Sapphire Nexus API", () => {
  test("serves the operator workbench as the first screen", async () => {
    const res = await app.request("http://127.0.0.1:4420/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Sapphire Nexus");
    expect(html).toContain("live actions disabled");
    expect(html).toContain("Readiness");
    expect(html).toContain("summary-only");
    expect(html).toContain("Local prompt smoke");
    expect(html).toContain("Open Source Shortlist");
    expect(html).toContain("Reference Only");
  });

  test("serves a favicon to keep browser smoke clean", async () => {
    const res = await app.request("/favicon.ico");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
  });

  test("serves machine-readable discovery and core routes", async () => {
    const discoveryRes = await app.request("http://127.0.0.1:4420/.well-known/sapphire-nexus.json");
    expect(discoveryRes.status).toBe(200);
    const discovery = await discoveryRes.json();
    expect(discovery.origin).toBe("http://127.0.0.1:4420");
    expect(discovery.routes.thesis).toBe("/v1/thesis");
    expect(discovery.routes.llmsTxt).toBe("/llms.txt");
    expect(discovery.routes.robotsTxt).toBe("/robots.txt");
    expect(discovery.routes.publicSourcesReadiness).toBe("/v1/adapters/public-sources/readiness");

    const llmsRes = await app.request("http://127.0.0.1:4420/llms.txt");
    expect(llmsRes.status).toBe(200);
    expect(llmsRes.headers.get("content-type")).toContain("text/plain");
    const llmsText = await llmsRes.text();
    expect(llmsText).toContain("Sapphire Nexus");
    expect(llmsText).toContain("live actions disabled");
    expect(llmsText).toContain("THO / Project-Go-Forward is out of scope");
    expect(llmsText).not.toContain("SECRET");

    const robotsRes = await app.request("http://127.0.0.1:4420/robots.txt");
    expect(robotsRes.status).toBe(200);
    expect(robotsRes.headers.get("content-type")).toContain("text/plain");
    expect(await robotsRes.text()).toContain("llms.txt: http://127.0.0.1:4420/llms.txt");

    const landscapeRes = await app.request("/v1/landscape");
    expect(landscapeRes.status).toBe(200);
    const landscape = await landscapeRes.json();
    expect(landscape.schemaId).toBe("sapphire.nexus.landscape.v1");

    const ledgerRes = await app.request("/v1/evidence-ledger");
    expect(ledgerRes.status).toBe(200);
    const ledger = await ledgerRes.json();
    expect(ledger.schemaId).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(ledger.safety.rawPayloadsStored).toBe(false);

    const publicSourcesRes = await app.request("/v1/adapters/public-sources/readiness");
    expect(publicSourcesRes.status).toBe(200);
    const publicSources = await publicSourcesRes.json();
    expect(publicSources.schemaId).toBe("sapphire.nexus.adapter.public_sources.v1");
    expect(publicSources.summary.status).toBe("ready");
    expect(publicSources.safety.fetchesRemoteSources).toBe(false);
    expect(publicSources.safety.vendorsCode).toBe(false);

    const aoeRes = await app.request("/v1/adapters/aoe/readiness");
    expect(aoeRes.status).toBe(200);
    const aoe = await aoeRes.json();
    expect(aoe.schemaId).toBe("sapphire.nexus.adapter.aoe_readiness.v1");
    expect(aoe.safety.paymentSettlementAllowed).toBe(false);

    const runtimeRes = await app.request("/v1/adapters/agent-runtime/publication");
    expect(runtimeRes.status).toBe(200);
    const runtime = await runtimeRes.json();
    expect(runtime.schemaId).toBe("sapphire.nexus.adapter.agent_runtime_publication.v1");
    expect(runtime.safety.storesGeneratedPayloads).toBe(false);

    const promptSmokeRes = await app.request("/v1/model-gateway/prompt-smoke");
    expect(promptSmokeRes.status).toBe(200);
    const promptSmoke = await promptSmokeRes.json();
    expect(promptSmoke.schemaId).toBe("sapphire.nexus.model_prompt_smoke.v1");
    expect(promptSmoke.summary.status).toBe("disabled");
    expect(promptSmoke.safety.storesPrompts).toBe(false);

    const marketRes = await app.request("/v1/market/research-posture");
    expect(marketRes.status).toBe(200);
    const market = await marketRes.json();
    expect(market.liveTradingAllowed).toBe(false);
  });

  test("uses forwarded origin for public metadata links", async () => {
    const headers = {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "nexus.example.com",
    };

    const discoveryRes = await app.request("http://internal.local/.well-known/sapphire-nexus.json", { headers });
    expect(discoveryRes.status).toBe(200);
    const discovery = await discoveryRes.json();
    expect(discovery.origin).toBe("https://nexus.example.com");

    const robotsRes = await app.request("http://internal.local/robots.txt", { headers });
    expect(robotsRes.status).toBe(200);
    expect(await robotsRes.text()).toContain("llms.txt: https://nexus.example.com/llms.txt");
  });
});
