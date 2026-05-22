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
    expect(html).toContain("Open Source Shortlist");
    expect(html).toContain("Reference Only");
  });

  test("serves machine-readable discovery and core routes", async () => {
    const discoveryRes = await app.request("http://127.0.0.1:4420/.well-known/sapphire-nexus.json");
    expect(discoveryRes.status).toBe(200);
    const discovery = await discoveryRes.json();
    expect(discovery.origin).toBe("http://127.0.0.1:4420");
    expect(discovery.routes.thesis).toBe("/v1/thesis");

    const landscapeRes = await app.request("/v1/landscape");
    expect(landscapeRes.status).toBe(200);
    const landscape = await landscapeRes.json();
    expect(landscape.schemaId).toBe("sapphire.nexus.landscape.v1");

    const ledgerRes = await app.request("/v1/evidence-ledger");
    expect(ledgerRes.status).toBe(200);
    const ledger = await ledgerRes.json();
    expect(ledger.schemaId).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(ledger.safety.rawPayloadsStored).toBe(false);

    const aoeRes = await app.request("/v1/adapters/aoe/readiness");
    expect(aoeRes.status).toBe(200);
    const aoe = await aoeRes.json();
    expect(aoe.schemaId).toBe("sapphire.nexus.adapter.aoe_readiness.v1");
    expect(aoe.safety.paymentSettlementAllowed).toBe(false);

    const marketRes = await app.request("/v1/market/research-posture");
    expect(marketRes.status).toBe(200);
    const market = await marketRes.json();
    expect(market.liveTradingAllowed).toBe(false);
  });
});
