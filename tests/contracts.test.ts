import { describe, expect, test } from "vitest";
import {
  buildHealth,
  buildLandscapeEvidenceLedger,
  buildMarketResearchPosture,
  buildModelGateway,
  checkModelGatewayReadiness,
  buildThesis,
  buildWellKnown,
  loadLandscape,
} from "../src/contracts.js";

describe("Sapphire Nexus contracts", () => {
  test("landscape stores derived links and protected boundaries", () => {
    const landscape = loadLandscape();
    expect(landscape.schemaId).toBe("sapphire.nexus.landscape.v1");
    expect(landscape.ownedRepoSignals.map((repo) => repo.repo)).toContain("arigatoexpress/Sapphire");
    expect(landscape.ownedRepoSignals.map((repo) => repo.repo)).toContain("arigatoexpress/cyber-threat-bot");
    expect(landscape.openSourceShortlist.map((repo) => repo.repo)).toContain("ollama/ollama");
    expect(landscape.openSourceShortlist.map((repo) => repo.repo)).toContain("qdrant/qdrant");
    expect(landscape.notCore?.map((repo) => repo.repo)).toContain("FlowiseAI/Flowise");
    expect(landscape.protectedLanes).toContain("THO / Project-Go-Forward");
    expect(landscape.protectedLanes).toContain("regional-intel-workbench");
  });

  test("health and well-known discovery keep live actions disabled", () => {
    const health = buildHealth(new Date("2026-05-22T17:00:00.000-06:00"));
    expect(health.schemaId).toBe("sapphire.nexus.health.v1");
    expect(health.liveActionsEnabled).toBe(false);

    const wellKnown = buildWellKnown("http://127.0.0.1:4420");
    expect(wellKnown.schemaIds.evidenceLedger).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(wellKnown.schemaIds.modelGateway).toBe("sapphire.nexus.model_gateway.v1");
    expect(wellKnown.schemaIds.modelGatewayReadiness).toBe("sapphire.nexus.model_gateway_readiness.v1");
    expect(wellKnown.routes.marketResearchPosture).toBe("/v1/market/research-posture");
    expect(wellKnown.safety.liveTradingAllowed).toBe(false);
    expect(wellKnown.safety.productionInfraMutationAllowed).toBe(false);
  });

  test("thesis mines parts without claiming protected app ownership", () => {
    const thesis = buildThesis();
    expect(thesis.schemaId).toBe("sapphire.nexus.thesis.v1");
    expect(thesis.preserveAsProducts).toContain("0guard");
    expect(thesis.blockedClaims).toContain("THO or Project-Go-Forward ownership");
    expect(thesis.architecture).toContain("local model gateway contract");
  });

  test("evidence ledger stores stable hashes and no raw payloads", () => {
    const ledger = buildLandscapeEvidenceLedger();
    expect(ledger.schemaId).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(ledger.safety.rawPayloadsStored).toBe(false);
    expect(ledger.safety.readsSecrets).toBe(false);
    expect(ledger.summary.records).toBeGreaterThan(10);
    expect(ledger.summary.byKind["owned-repo"]).toBeGreaterThan(3);
    expect(ledger.records[0].evidenceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(ledger.records.some((record) => record.sourceId === "arigatoexpress/Sapphire")).toBe(true);
  });

  test("model gateway exposes Ollama and Windows GPU as contracts only", () => {
    const gateway = buildModelGateway({
      SAPPHIRE_NEXUS_OLLAMA_URL: "http://127.0.0.1:11434",
      SAPPHIRE_NEXUS_WINDOWS_GPU_URL: "http://192.168.1.61:9090",
    });
    expect(gateway.schemaId).toBe("sapphire.nexus.model_gateway.v1");
    expect(gateway.gateways.map((entry) => entry.id)).toEqual(["ollama-local", "windows-gpu"]);
    expect(gateway.policy.readsSecrets).toBe(false);
    expect(gateway.policy.canTrainModels).toBe(false);
    expect(gateway.policy.trainingRequiresExplicitDatasetPlan).toBe(true);
  });

  test("model gateway readiness probes health without prompts or mutation", async () => {
    const fakeFetch = async (url: string | URL | Request) => {
      const value = String(url);
      if (value.endsWith("/api/tags")) {
        return Response.json({ models: [{ name: "qwen3.6:27b" }, { name: "hermes3:8b" }] });
      }
      return Response.json({ status: "healthy", service: "windows_webhook" });
    };

    const readiness = await checkModelGatewayReadiness({
      env: {
        SAPPHIRE_NEXUS_OLLAMA_URL: "http://127.0.0.1:11434",
        SAPPHIRE_NEXUS_WINDOWS_GPU_URL: "http://192.168.1.61:9090",
      },
      fetchImpl: fakeFetch as typeof fetch,
      now: new Date("2026-05-22T17:00:00.000-06:00"),
    });

    expect(readiness.schemaId).toBe("sapphire.nexus.model_gateway_readiness.v1");
    expect(readiness.summary.ready).toBe(2);
    expect(readiness.safety.sendsPrompts).toBe(false);
    expect(readiness.safety.startsTraining).toBe(false);
    expect(readiness.gateways[0].detail).toEqual({ modelCount: 2, modelNames: ["qwen3.6:27b", "hermes3:8b"] });
    expect(readiness.gateways[1].detail).toEqual({ status: "healthy", service: "windows_webhook" });
  });

  test("market posture is research-only and blocks execution language", () => {
    const posture = buildMarketResearchPosture();
    expect(posture.schemaId).toBe("sapphire.nexus.market_research_posture.v1");
    expect(posture.mode).toBe("research_only");
    expect(posture.liveTradingAllowed).toBe(false);
    expect(posture.blockedOutputs).toContain("buy/sell/hold advice");
  });
});
