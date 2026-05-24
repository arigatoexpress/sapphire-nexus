import { describe, expect, test } from "vitest";
import { checkAoeReadiness } from "../src/adapters/aoe.js";
import { checkAgentRuntimePublication } from "../src/adapters/agent-runtime.js";
import { buildPublicSourcesReadiness } from "../src/adapters/public-sources.js";
import { buildRepoMiningReadiness } from "../src/adapters/repo-mining.js";
import { buildTrendingSignalsReadiness } from "../src/adapters/trending-signals.js";
import {
  buildClientBrief,
  buildHealth,
  buildLandscapeEvidenceLedger,
  buildMarketResearchPosture,
  buildModelGateway,
  buildOperatorNextActions,
  buildVerificationManifest,
  checkModelGatewayReadiness,
  checkModelPromptSmoke,
  buildThesis,
  buildWellKnown,
  loadLandscape,
} from "../src/contracts.js";
import { buildDataFreshness } from "../src/freshness.js";
import { checkNexusReadiness } from "../src/readiness.js";
import { buildDeploymentIdentity } from "../src/deployment.js";
import { resolveServerConfig } from "../src/server-config.js";
import { buildDataRefreshPlan } from "../src/refresh-plan.js";

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
    expect(wellKnown.routes.openApi).toBe("/openapi.json");
    expect(wellKnown.schemaIds.openApi).toBe("sapphire.nexus.openapi.v1");
    expect(wellKnown.routes.clientBrief).toBe("/v1/client/brief");
    expect(wellKnown.schemaIds.clientBrief).toBe("sapphire.nexus.client_brief.v1");
    expect(wellKnown.routes.verificationManifest).toBe("/v1/verification-manifest");
    expect(wellKnown.schemaIds.verificationManifest).toBe("sapphire.nexus.verification_manifest.v1");
    expect(wellKnown.routes.deployment).toBe("/v1/deployment");
    expect(wellKnown.schemaIds.deployment).toBe("sapphire.nexus.deployment_identity.v1");
    expect(wellKnown.routes.dataFreshness).toBe("/v1/data/freshness");
    expect(wellKnown.schemaIds.dataFreshness).toBe("sapphire.nexus.data_freshness.v1");
    expect(wellKnown.routes.dataRefreshPlan).toBe("/v1/data/refresh-plan");
    expect(wellKnown.schemaIds.dataRefreshPlan).toBe("sapphire.nexus.data_refresh_plan.v1");
    expect(wellKnown.schemaIds.evidenceLedger).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(wellKnown.routes.repoMiningReadiness).toBe("/v1/adapters/repo-mining/readiness");
    expect(wellKnown.schemaIds.repoMiningReadiness).toBe("sapphire.nexus.adapter.repo_mining.v1");
    expect(wellKnown.routes.trendingSignalsReadiness).toBe("/v1/adapters/trending-signals/readiness");
    expect(wellKnown.schemaIds.trendingSignalsReadiness).toBe("sapphire.nexus.adapter.trending_signals.v1");
    expect(wellKnown.routes.readiness).toBe("/v1/readiness");
    expect(wellKnown.schemaIds.readiness).toBe("sapphire.nexus.readiness.v1");
    expect(wellKnown.routes.publicSourcesReadiness).toBe("/v1/adapters/public-sources/readiness");
    expect(wellKnown.schemaIds.publicSourcesReadiness).toBe("sapphire.nexus.adapter.public_sources.v1");
    expect(wellKnown.schemaIds.aoeReadiness).toBe("sapphire.nexus.adapter.aoe_readiness.v1");
    expect(wellKnown.schemaIds.agentRuntimePublication).toBe("sapphire.nexus.adapter.agent_runtime_publication.v1");
    expect(wellKnown.schemaIds.modelGateway).toBe("sapphire.nexus.model_gateway.v1");
    expect(wellKnown.schemaIds.modelGatewayReadiness).toBe("sapphire.nexus.model_gateway_readiness.v1");
    expect(wellKnown.routes.modelPromptSmoke).toBe("/v1/model-gateway/prompt-smoke");
    expect(wellKnown.schemaIds.modelPromptSmoke).toBe("sapphire.nexus.model_prompt_smoke.v1");
    expect(wellKnown.routes.marketResearchPosture).toBe("/v1/market/research-posture");
    expect(wellKnown.routes.operatorNextActions).toBe("/v1/operator/next-actions");
    expect(wellKnown.schemaIds.operatorNextActions).toBe("sapphire.nexus.operator_next_actions.v1");
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

  test("deployment identity exposes only safe runtime metadata", () => {
    const identity = buildDeploymentIdentity(
      "https://nexus.example.com",
      {
        SAPPHIRE_NEXUS_PUBLIC_MODE: "true",
        K_SERVICE: "sapphire-nexus",
        K_REVISION: "sapphire-nexus-00006-b8f",
        K_CONFIGURATION: "sapphire-nexus",
        SECRET_TOKEN: "do-not-leak",
      },
      new Date("2026-05-23T06:50:00.000Z"),
    );

    expect(identity.schemaId).toBe("sapphire.nexus.deployment_identity.v1");
    expect(identity.origin).toBe("https://nexus.example.com");
    expect(identity.runtime.provider).toBe("cloud-run");
    expect(identity.runtime.revision).toBe("sapphire-nexus-00006-b8f");
    expect(identity.mode.publicDeployment).toBe(true);
    expect(identity.mode.liveActionsEnabled).toBe(false);
    expect(identity.safety.readsSecrets).toBe(false);
    expect(identity.safety.exposesEnvironmentDump).toBe(false);
    expect(JSON.stringify(identity)).not.toContain("do-not-leak");
    expect(JSON.stringify(identity)).not.toContain("SECRET_TOKEN");
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

  test("public source adapter classifies rights without remote fetches or vendoring", () => {
    const report = buildPublicSourcesReadiness(loadLandscape(), new Date("2026-05-23T01:40:00.000Z"));

    expect(report.schemaId).toBe("sapphire.nexus.adapter.public_sources.v1");
    expect(report.summary.status).toBe("ready");
    expect(report.summary.publicSources).toBeGreaterThan(10);
    expect(report.summary.permissive).toBeGreaterThan(5);
    expect(report.summary.referenceOnly).toBeGreaterThan(0);
    expect(report.summary.needsReview).toBe(0);
    expect(report.safety.fetchesRemoteSources).toBe(false);
    expect(report.safety.vendorsCode).toBe(false);
    expect(report.safety.rawPayloadsStored).toBe(false);
    expect(report.policy.copyleftSourcesReferenceOnly).toBe(true);
    expect(report.sources.find((source) => source.sourceId === "OpenBB-finance/OpenBB")?.rights.reusePosture).toBe(
      "reference-only",
    );
    expect(report.sources[0].sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("repo mining adapter keeps owned repo reuse contract-only", () => {
    const report = buildRepoMiningReadiness(loadLandscape(), new Date("2026-05-23T20:40:00.000Z"));

    expect(report.schemaId).toBe("sapphire.nexus.adapter.repo_mining.v1");
    expect(report.summary.status).toBe("ready");
    expect(report.summary.repos).toBeGreaterThan(5);
    expect(report.summary.mineSignals).toBeGreaterThan(report.summary.repos);
    expect(report.summary.avoidSignals).toBeGreaterThan(0);
    expect(report.safety.fetchesRemoteSources).toBe(false);
    expect(report.safety.vendorsCode).toBe(false);
    expect(report.safety.deletesSourceRepos).toBe(false);
    expect(report.policy.protectedProductsStaySeparate).toBe(true);
    expect(report.policy.perRepoReviewRequiredBeforeCodeReuse).toBe(true);
    expect(report.repos.find((repo) => repo.sourceId === "arigatoexpress/Sapphire")?.rights.reusePosture).toBe(
      "contract_metadata_only",
    );
    expect(report.repos[0].sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("trending signals adapter exposes snapshot metadata without current trend claims", () => {
    const report = buildTrendingSignalsReadiness(loadLandscape(), new Date("2026-05-23T23:05:00.000Z"));

    expect(report.schemaId).toBe("sapphire.nexus.adapter.trending_signals.v1");
    expect(report.summary.status).toBe("ready");
    expect(report.summary.signals).toBeGreaterThan(0);
    expect(report.summary.totalStarsThisWeek).toBeGreaterThan(0);
    expect(report.summary.currentTrendClaimsAllowed).toBe(false);
    expect(report.summary.manualRefreshRequiredForCurrentClaims).toBe(true);
    expect(report.safety.fetchesRemoteSources).toBe(false);
    expect(report.safety.vendorsCode).toBe(false);
    expect(report.policy.snapshotOnly).toBe(true);
    expect(report.policy.refreshRequiredBeforeClientTrendClaims).toBe(true);
    expect(report.signals[0].rights.reusePosture).toBe("metadata_snapshot_only");
    expect(report.signals[0].sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("data freshness contract caveats checked-in snapshots before client claims", () => {
    const report = buildDataFreshness("https://nexus.example.com", loadLandscape(), new Date("2026-05-23T23:34:00.000Z"));

    expect(report.schemaId).toBe("sapphire.nexus.data_freshness.v1");
    expect(report.origin).toBe("https://nexus.example.com");
    expect(report.summary.status).toBe("ready");
    expect(report.summary.datasets).toBe(5);
    expect(report.summary.manualRefreshRequiredForCurrentClaims).toBeGreaterThanOrEqual(1);
    expect(report.safety.fetchesRemoteSources).toBe(false);
    expect(report.safety.storesRawPayloads).toBe(false);
    expect(report.policy.checkedInMetadataOnly).toBe(true);
    expect(report.policy.currentTrendClaimsRequireManualRefresh).toBe(true);
    expect(report.datasets.map((dataset) => dataset.id)).toContain("trendingSignals");
    expect(report.datasets.find((dataset) => dataset.id === "trendingSignals")?.currentClaimsAllowed).toBe(false);
    expect(report.datasets.find((dataset) => dataset.id === "trendingSignals")?.manualRefreshRequiredForCurrentClaims).toBe(true);
    expect(report.datasets[0].freshnessHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("data refresh plan describes reviewed metadata refresh without fetching or writing", () => {
    const plan = buildDataRefreshPlan("https://nexus.example.com", loadLandscape(), new Date("2026-05-24T00:05:00.000Z"));

    expect(plan.schemaId).toBe("sapphire.nexus.data_refresh_plan.v1");
    expect(plan.origin).toBe("https://nexus.example.com");
    expect(plan.summary.status).toBe("ready");
    expect(plan.summary.inputs).toBe(4);
    expect(plan.summary.remoteFetchesPerformed).toBe(false);
    expect(plan.summary.writesPerformed).toBe(false);
    expect(plan.summary.manualRefreshRequiredForCurrentClaims).toBeGreaterThanOrEqual(1);
    expect(plan.target.path).toBe("data/landscape.json");
    expect(plan.safety.fetchesRemoteSources).toBe(false);
    expect(plan.safety.writesDataInThisRoute).toBe(false);
    expect(plan.safety.storesRawPayloads).toBe(false);
    expect(plan.policy.officialSourcesOnly).toBe(true);
    expect(plan.policy.sourceRightsReviewRequired).toBe(true);
    expect(plan.workflow.map((step) => step.lane)).toContain("ari-review");
    expect(plan.inputs.find((input) => input.id === "trendingSignals")?.rights.freshnessTtlHours).toBe(24);
    expect(plan.inputs[0].refreshHash).toMatch(/^sha256:[a-f0-9]{64}$/);
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
    expect(report.summary).toEqual({ endpoints: 4, ready: 4, degraded: 0, status: "ready", operatorHint: null });
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

  test("AOE adapter reports an operator hint without starting adjacent services", async () => {
    const report = await checkAoeReadiness({
      baseUrl: "http://127.0.0.1:4402",
      fetchImpl: (async () => {
        throw new Error("offline");
      }) as typeof fetch,
      now: new Date("2026-05-23T00:40:00.000Z"),
    });

    expect(report.summary.status).toBe("unreachable");
    expect(report.summary.operatorHint).toEqual({
      reason: "aoe adapter is not fully reachable",
      expectedBaseUrl: "http://127.0.0.1:4402",
      autoStart: false,
      mutatesAdjacentService: false,
      safeNextAction:
        "Start or deploy AOE separately, then point SAPPHIRE_NEXUS_AOE_URL at that read-only public contract surface.",
    });
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

  test("public deployment mode disables local model gateway probes", async () => {
    let called = false;
    const readiness = await checkModelGatewayReadiness({
      env: { VERCEL: "1" },
      fetchImpl: (async () => {
        called = true;
        return Response.json({});
      }) as typeof fetch,
      now: new Date("2026-05-23T00:20:00.000Z"),
    });

    expect(called).toBe(false);
    expect(readiness.summary.disabled).toBe(2);
    expect(readiness.summary.degraded).toBe(0);
    expect(readiness.gateways.map((gateway) => gateway.status)).toEqual(["disabled", "disabled"]);
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

  test("public deployment mode disables adapter probes without shelling out or fetching", async () => {
    let fetched = false;
    let executed = false;
    const env = { SAPPHIRE_NEXUS_PUBLIC_MODE: "true" };
    const [aoe, runtime, promptSmoke] = await Promise.all([
      checkAoeReadiness({
        env,
        fetchImpl: (async () => {
          fetched = true;
          return Response.json({});
        }) as typeof fetch,
      }),
      checkAgentRuntimePublication({
        env,
        commandRunner: async () => {
          executed = true;
          return { stdout: "{}" };
        },
      }),
      checkModelPromptSmoke({
        env: {
          ...env,
          SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED: "true",
          SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL: "qwen3.6:27b",
        },
        fetchImpl: (async () => {
          fetched = true;
          return Response.json({});
        }) as typeof fetch,
      }),
    ]);

    expect(fetched).toBe(false);
    expect(executed).toBe(false);
    expect(aoe.summary.status).toBe("disabled");
    expect(aoe.summary.operatorHint).toEqual(expect.objectContaining({ autoStart: false }));
    expect(runtime.summary.status).toBe("disabled");
    expect(promptSmoke.summary.status).toBe("disabled");
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

  test("nexus readiness rolls up probes without exposing raw payloads", async () => {
    const report = await checkNexusReadiness({
      now: new Date("2026-05-22T17:42:00.000-06:00"),
      probes: {
        health: () => ({ status: "ok", liveActionsEnabled: false }),
        evidenceLedger: () => ({
          safety: { rawPayloadsStored: false },
          summary: { records: 41 },
          rawPayload: "PRIVATE_SAMPLE",
        }),
        dataFreshness: () => ({
          safety: { fetchesRemoteSources: false },
          summary: {
            status: "ready",
            datasets: 5,
            current: 4,
            snapshot: 0,
            review: 1,
            manualRefreshRequiredForCurrentClaims: 1,
          },
          rawPayload: "PRIVATE_FRESHNESS_SAMPLE",
        }),
        repoMining: () => ({
          safety: { fetchesRemoteSources: false, vendorsCode: false, deletesSourceRepos: false },
          summary: { status: "ready", repos: 9, mineSignals: 22, avoidSignals: 11, protectedLanesPreserved: 6 },
          rawPayload: "PRIVATE_REPO_SAMPLE",
        }),
        trendingSignals: () => ({
          safety: { fetchesRemoteSources: false, vendorsCode: false },
          summary: {
            status: "ready",
            signals: 3,
            totalStarsThisWeek: 26128,
            snapshotAt: "2026-05-22T17:10:00.000-06:00",
            currentTrendClaimsAllowed: false,
            manualRefreshRequiredForCurrentClaims: true,
          },
          rawPayload: "PRIVATE_TREND_SAMPLE",
        }),
        publicSources: () => ({
          safety: { rawPayloadsStored: false },
          summary: { status: "ready", publicSources: 18, permissive: 15, referenceOnly: 3, needsReview: 0 },
          rawPayload: "PRIVATE_SOURCE_SAMPLE",
        }),
        modelGateway: () => ({ summary: { gateways: 2, ready: 2, degraded: 0 } }),
        modelPromptSmoke: () => ({
          summary: { status: "disabled", ready: false, reason: "not enabled" },
          safety: { sendsUserPrompts: false, storesPrompts: false, storesCompletions: false },
        }),
        aoe: () => ({ summary: { status: "ready", endpoints: 4, ready: 4, degraded: 0 } }),
        agentRuntime: () => ({
          summary: {
            status: "ready",
            publicExportBlocked: false,
            trackedSourceReady: true,
            secretViolationCount: 0,
            ignoredGeneratedOutputCount: 5,
          },
        }),
      },
    });

    expect(report.schemaId).toBe("sapphire.nexus.readiness.v1");
    expect(report.status).toBe("ready");
    expect(report.summary).toEqual({ checks: 10, ready: 9, degraded: 0, disabled: 1, productionUsable: true });
    expect(report.safety.liveActionsEnabled).toBe(false);
    expect(report.checks.map((check) => check.id)).toEqual([
      "health",
      "evidenceLedger",
      "dataFreshness",
      "repoMining",
      "trendingSignals",
      "publicSources",
      "modelGateway",
      "modelPromptSmoke",
      "aoe",
      "agentRuntime",
    ]);
    expect(report.checks.find((check) => check.id === "modelPromptSmoke")?.status).toBe("disabled");
    expect(JSON.stringify(report)).not.toContain("PRIVATE_SAMPLE");
    expect(JSON.stringify(report)).not.toContain("PRIVATE_FRESHNESS_SAMPLE");
    expect(JSON.stringify(report)).not.toContain("PRIVATE_REPO_SAMPLE");
    expect(JSON.stringify(report)).not.toContain("PRIVATE_TREND_SAMPLE");
    expect(JSON.stringify(report)).not.toContain("PRIVATE_SOURCE_SAMPLE");
  });

  test("nexus readiness treats public-mode local adapters as disabled, not degraded", async () => {
    const report = await checkNexusReadiness({
      env: { VERCEL: "1" },
      now: new Date("2026-05-23T00:21:00.000Z"),
    });

    expect(report.status).toBe("ready");
    expect(report.summary.ready).toBe(6);
    expect(report.summary.degraded).toBe(0);
    expect(report.summary.disabled).toBe(4);
    expect(report.summary.productionUsable).toBe(true);
    expect(report.checks.find((check) => check.id === "repoMining")?.status).toBe("ready");
    expect(report.checks.find((check) => check.id === "trendingSignals")?.status).toBe("ready");
    expect(report.checks.find((check) => check.id === "publicSources")?.status).toBe("ready");
    expect(report.checks.find((check) => check.id === "modelGateway")?.status).toBe("disabled");
    expect(report.checks.find((check) => check.id === "aoe")?.status).toBe("disabled");
    expect(report.checks.find((check) => check.id === "agentRuntime")?.status).toBe("disabled");
    expect(report.checks.find((check) => check.id === "aoe")?.detail.operatorHint).toEqual(
      expect.objectContaining({ autoStart: false, mutatesAdjacentService: false }),
    );
  });

  test("market posture is research-only and blocks execution language", () => {
    const posture = buildMarketResearchPosture();
    expect(posture.schemaId).toBe("sapphire.nexus.market_research_posture.v1");
    expect(posture.mode).toBe("research_only");
    expect(posture.liveTradingAllowed).toBe(false);
    expect(posture.blockedOutputs).toContain("buy/sell/hold advice");
  });

  test("operator next actions separate agent-safe work from Ari-only decisions", () => {
    const nextActions = buildOperatorNextActions(new Date("2026-05-23T19:10:00.000Z"));

    expect(nextActions.schemaId).toBe("sapphire.nexus.operator_next_actions.v1");
    expect(nextActions.summary).toEqual({
      actions: 4,
      agentSafe: 2,
      ariDecision: 2,
      blocked: 2,
      liveActionsEnabled: false,
    });
    expect(nextActions.actions.map((action) => action.lane)).toEqual(["agent-safe", "agent-safe", "ari-only", "ari-only"]);
    expect(nextActions.actions.find((action) => action.id === "custom-domain-choice")?.approvalRequired).toBe(true);
    expect(nextActions.actions.find((action) => action.id === "verify-live-surface")?.route).toBe("/v1/deployment");
    expect(nextActions.safety.liveTradingAllowed).toBe(false);
    expect(nextActions.safety.mutatesRuntime).toBe(false);
    expect(nextActions.policy.ariDecisionRequiredForDomainOrPromotionPolicy).toBe(true);
  });

  test("client brief summarizes public-safe production value without live claims", () => {
    const brief = buildClientBrief("https://nexus.example.com", loadLandscape(), new Date("2026-05-23T19:40:00.000Z"));

    expect(brief.schemaId).toBe("sapphire.nexus.client_brief.v1");
    expect(brief.product.publicUrl).toBe("https://nexus.example.com");
    expect(brief.productionStatus.publicSurface).toBe("live");
    expect(brief.productionStatus.liveActionsEnabled).toBe(false);
    expect(brief.productionStatus.verifiedBy).toContain("/openapi.json");
    expect(brief.productionStatus.verifiedBy).toContain("/v1/data/refresh-plan");
    expect(brief.capabilities.map((capability) => capability.route)).toContain("/v1/evidence-ledger");
    expect(brief.capabilities.map((capability) => capability.route)).toContain("/v1/data/refresh-plan");
    expect(brief.protectedBoundaries).toContain("THO / Project-Go-Forward");
    expect(brief.blockedClaims).toContain("wallet signing");
    expect(brief.safety.rawPayloadsPublished).toBe(false);
    expect(brief.safety.promisesProductionTrading).toBe(false);
    expect(brief.safety.exposesPrivateInfrastructure).toBe(false);
  });

  test("verification manifest describes public checks without private access", () => {
    const manifest = buildVerificationManifest("https://nexus.example.com", new Date("2026-05-23T20:10:00.000Z"));

    expect(manifest.schemaId).toBe("sapphire.nexus.verification_manifest.v1");
    expect(manifest.origin).toBe("https://nexus.example.com");
    expect(manifest.summary.checks).toBe(16);
    expect(manifest.summary.requiredHeaders).toBeGreaterThanOrEqual(5);
    expect(manifest.summary.productionClaimsRequireRevisionMatch).toBe(true);
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/deployment");
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/data/freshness");
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/data/refresh-plan");
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/client/brief");
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/adapters/repo-mining/readiness");
    expect(manifest.checks.map((check) => check.route)).toContain("/v1/adapters/trending-signals/readiness");
    expect(manifest.requiredHeaders["x-frame-options"]).toBe("DENY");
    expect(manifest.commands.productionSmoke).toContain("SAPPHIRE_NEXUS_EXPECTED_REVISION");
    expect(manifest.safety.liveTradingAllowed).toBe(false);
    expect(manifest.safety.requiresPrivateNetwork).toBe(false);
  });

  test("server config binds to Cloud Run host and port when deployed", () => {
    expect(resolveServerConfig({ PORT: "8080", K_SERVICE: "sapphire-nexus" })).toEqual({ host: "0.0.0.0", port: 8080 });
    expect(resolveServerConfig({})).toEqual({ host: "127.0.0.1", port: 4420 });
  });
});
