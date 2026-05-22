import { describe, expect, test } from "vitest";
import { checkAoeReadiness } from "../src/adapters/aoe.js";
import { checkAgentRuntimePublication } from "../src/adapters/agent-runtime.js";
import {
  buildHealth,
  buildLandscapeEvidenceLedger,
  buildMarketResearchPosture,
  buildModelGateway,
  checkModelGatewayReadiness,
  checkModelPromptSmoke,
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
    expect(wellKnown.schemaIds.aoeReadiness).toBe("sapphire.nexus.adapter.aoe_readiness.v1");
    expect(wellKnown.schemaIds.agentRuntimePublication).toBe("sapphire.nexus.adapter.agent_runtime_publication.v1");
    expect(wellKnown.schemaIds.modelGateway).toBe("sapphire.nexus.model_gateway.v1");
    expect(wellKnown.schemaIds.modelGatewayReadiness).toBe("sapphire.nexus.model_gateway_readiness.v1");
    expect(wellKnown.routes.modelPromptSmoke).toBe("/v1/model-gateway/prompt-smoke");
    expect(wellKnown.schemaIds.modelPromptSmoke).toBe("sapphire.nexus.model_prompt_smoke.v1");
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

  test("AOE adapter summarizes public contracts without storing raw bundles", async () => {
    const fakeFetch = async (url: string | URL | Request) => {
      const value = String(url);
      if (value.endsWith("/health")) {
        return Response.json({
          status: "ok",
          service: "agent-opportunity-exchange",
          liveSettlementAllowed: false,
          externalSideEffectsAllowed: false,
        });
      }
      if (value.endsWith("/.well-known/agent-opportunity-exchange.json")) {
        return Response.json({
          schemaId: "aoe.discovery.v1",
          service: "agent-opportunity-exchange",
          routes: { readiness: "/v1/readiness", contracts: "/v1/contracts" },
          schemaIds: { readiness: "aoe.readiness.v1", contractBundle: "aoe.contract_bundle.v1" },
          freeEndpoints: ["/health", "/v1/readiness", "/v1/contracts"],
        });
      }
      if (value.endsWith("/v1/readiness")) {
        return Response.json({
          schemaId: "aoe.readiness.v1",
          liveSettlementAllowed: false,
          externalSideEffectsAllowed: false,
          adapters: [{ adapterId: "demo" }],
          counts: { live_read_only: 9, key_required: 1 },
          contracts: {
            buyerDiscoveryReady: true,
            routeSchemasCovered: true,
            productSchemasCovered: true,
          },
        });
      }
      return Response.json({
        schemaId: "aoe.contract_bundle.v1",
        bundleVersion: "2026-05-10",
        liveSettlementAllowed: false,
        externalSideEffectsAllowed: false,
        pathContracts: [{ path: "/v1/readiness" }, { path: "/v1/contracts" }],
        schemaCatalog: { one: {}, two: {} },
        coverage: { buyerDiscoveryReady: true },
        paymentBoundary: {
          liveSettlementAllowed: false,
          mainnetAllowed: false,
          acceptedTestnet: "eip155:84532",
          serverPrivateKeyRequired: false,
        },
      });
    };

    const report = await checkAoeReadiness({
      baseUrl: "http://127.0.0.1:4402/",
      fetchImpl: fakeFetch as typeof fetch,
      now: new Date("2026-05-22T17:23:00.000-06:00"),
    });

    expect(report.schemaId).toBe("sapphire.nexus.adapter.aoe_readiness.v1");
    expect(report.adapter.baseUrl).toBe("http://127.0.0.1:4402");
    expect(report.summary).toEqual({ endpoints: 4, ready: 4, degraded: 0, status: "ready" });
    expect(report.safety.storesRawContractBundle).toBe(false);
    expect(report.safety.paymentSettlementAllowed).toBe(false);
    expect(report.endpoints.find((endpoint) => endpoint.id === "contracts")?.summary).toEqual(
      expect.objectContaining({
        schemaId: "aoe.contract_bundle.v1",
        pathContractCount: 2,
        schemaCatalogCount: 2,
      }),
    );
  });

  test("agent runtime adapter summarizes publication plan without generated payloads", async () => {
    const report = await checkAgentRuntimePublication({
      repoRoot: "/tmp/agent-runtime-control-plane",
      now: new Date("2026-05-22T17:28:00.000-06:00"),
      commandRunner: async () => ({
        stdout: JSON.stringify({
          schema: "aribs.agent_runtime_publication_plan.v1",
          safety: {
            mutatesRuntime: false,
            readsSecretValues: false,
            publishesRepo: false,
            generatedDataContentRead: false,
          },
          repository: {
            packagePrivate: true,
            remote: "https://github.com/arigatoexpress/agent-runtime-control-plane.git",
            visibilityCheck: "verify GitHub visibility with gh repo view before changing repository access",
          },
          readiness: {
            publicExportBlocked: false,
            trackedSourceReady: true,
            auditViolationCount: 0,
            generatedTrackedViolationCount: 0,
            secretViolationCount: 0,
            ignoredGeneratedOutputCount: 2,
          },
          exportPolicy: {
            include: ["tracked source"],
            exclude: ["generated data", "secrets"],
            requiresHumanApprovalBeforePublicVisibilityChange: true,
          },
          generatedOutputs: [
            { path: "data/runtime-surfaces.json", bytes: 100, publishAction: "exclude" },
            { path: "data/contract-inventory.json", bytes: 50, publishAction: "exclude" },
          ],
          violations: [],
        }),
      }),
    });

    expect(report.schemaId).toBe("sapphire.nexus.adapter.agent_runtime_publication.v1");
    expect(report.summary.status).toBe("ready");
    expect(report.summary.ignoredGeneratedOutputBytes).toBe(150);
    expect(report.safety.storesGeneratedPayloads).toBe(false);
    expect(report.safety.broadensPermissions).toBe(false);
    expect(report.exportPolicy.requiresHumanApprovalBeforePublicVisibilityChange).toBe(true);
    expect(report.generatedOutputs).toEqual([
      { path: "data/runtime-surfaces.json", bytes: 100, publishAction: "exclude" },
      { path: "data/contract-inventory.json", bytes: 50, publishAction: "exclude" },
    ]);
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

  test("model prompt smoke is disabled by default and stores no prompt text", async () => {
    let called = false;
    const report = await checkModelPromptSmoke({
      env: { SAPPHIRE_NEXUS_OLLAMA_URL: "http://127.0.0.1:11434" },
      fetchImpl: (async () => {
        called = true;
        return Response.json({});
      }) as typeof fetch,
      now: new Date("2026-05-22T17:35:00.000-06:00"),
    });

    expect(called).toBe(false);
    expect(report.schemaId).toBe("sapphire.nexus.model_prompt_smoke.v1");
    expect(report.summary.status).toBe("disabled");
    expect(report.safety.sendsUserPrompts).toBe(false);
    expect(report.safety.sendsFixedHealthcheckPrompt).toBe(false);
    expect(report.safety.storesPrompts).toBe(false);
    expect(report.policy.promptHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(report)).not.toContain("Return exactly");
  });

  test("model prompt smoke sends only a fixed healthcheck prompt when explicitly enabled", async () => {
    const seen: Array<{ url: string; body: Record<string, unknown> }> = [];
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({
        url: String(url),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return Response.json({ response: "NEXUS_OK", done: true });
    };

    const report = await checkModelPromptSmoke({
      env: {
        SAPPHIRE_NEXUS_OLLAMA_URL: "http://127.0.0.1:11434",
        SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED: "true",
        SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL: "qwen3.6:27b",
      },
      fetchImpl: fakeFetch as typeof fetch,
      now: new Date("2026-05-22T17:36:00.000-06:00"),
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe("http://127.0.0.1:11434/api/generate");
    expect(seen[0].body).toEqual({
      model: "qwen3.6:27b",
      prompt: "Return exactly the token NEXUS_OK.",
      stream: false,
      options: { temperature: 0, num_predict: 8 },
    });
    expect(report.summary.status).toBe("ready");
    expect(report.result?.completionReturned).toBe(true);
    expect(report.result?.completionMatched).toBe(true);
    expect(report.safety.sendsUserPrompts).toBe(false);
    expect(report.safety.sendsFixedHealthcheckPrompt).toBe(true);
    expect(report.safety.storesCompletions).toBe(false);
    expect(JSON.stringify(report)).not.toContain("Return exactly");
    expect(JSON.stringify(report)).not.toContain("NEXUS_OK");
  });

  test("market posture is research-only and blocks execution language", () => {
    const posture = buildMarketResearchPosture();
    expect(posture.schemaId).toBe("sapphire.nexus.market_research_posture.v1");
    expect(posture.mode).toBe("research_only");
    expect(posture.liveTradingAllowed).toBe(false);
    expect(posture.blockedOutputs).toContain("buy/sell/hold advice");
  });
});
