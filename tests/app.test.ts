import { describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Sapphire Nexus API", () => {
  test("sets public response hardening headers", async () => {
    for (const path of ["/", "/health", "/.well-known/sapphire-nexus.json", "/llms.txt", "/robots.txt"]) {
      const res = await app.request(`http://127.0.0.1:4420${path}`);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("cross-origin-opener-policy")).toBe("same-origin");
      expect(res.headers.get("permissions-policy")).toContain("payment=()");
    }
  });

  test("serves the operator workbench as the first screen", async () => {
    const res = await app.request("http://127.0.0.1:4420/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Sapphire Nexus");
    expect(html).toContain("live actions disabled");
    expect(html).toContain("Readiness");
    expect(html).toContain("Deployment Identity");
    expect(html).toContain("Client Brief");
    expect(html).toContain("/v1/client/brief");
    expect(html).toContain("Client Demo");
    expect(html).toContain("/v1/client/demo");
    expect(html).toContain("Data Freshness");
    expect(html).toContain("/v1/data/freshness");
    expect(html).toContain("Refresh Plan");
    expect(html).toContain("/v1/data/refresh-plan");
    expect(html).toContain("Refresh Artifact");
    expect(html).toContain("/v1/data/refresh-artifact");
    expect(html).toContain("Verification");
    expect(html).toContain("/v1/verification-manifest");
    expect(html).toContain("API Surface");
    expect(html).toContain("/openapi.json");
    expect(html).toContain("/v1/adapters/repo-mining/readiness");
    expect(html).toContain("/v1/adapters/trending-signals/readiness");
    expect(html).toContain("/v1/operator/next-actions");
    expect(html).toContain("Next Actions");
    expect(html).toContain("ari-only");
    expect(html).toContain("/v1/deployment");
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
    expect(discovery.routes.openApi).toBe("/openapi.json");
    expect(discovery.routes.llmsTxt).toBe("/llms.txt");
    expect(discovery.routes.robotsTxt).toBe("/robots.txt");
    expect(discovery.routes.deployment).toBe("/v1/deployment");
    expect(discovery.routes.dataFreshness).toBe("/v1/data/freshness");
    expect(discovery.routes.dataRefreshPlan).toBe("/v1/data/refresh-plan");
    expect(discovery.routes.metadataRefreshArtifact).toBe("/v1/data/refresh-artifact");
    expect(discovery.routes.clientDemo).toBe("/v1/client/demo");
    expect(discovery.routes.clientBrief).toBe("/v1/client/brief");
    expect(discovery.routes.verificationManifest).toBe("/v1/verification-manifest");
    expect(discovery.routes.repoMiningReadiness).toBe("/v1/adapters/repo-mining/readiness");
    expect(discovery.routes.trendingSignalsReadiness).toBe("/v1/adapters/trending-signals/readiness");
    expect(discovery.routes.publicSourcesReadiness).toBe("/v1/adapters/public-sources/readiness");
    expect(discovery.routes.operatorNextActions).toBe("/v1/operator/next-actions");

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

    const openApiRes = await app.request("http://127.0.0.1:4420/openapi.json");
    expect(openApiRes.status).toBe(200);
    const openApi = await openApiRes.json();
    expect(openApi.openapi).toBe("3.1.0");
    expect(openApi.servers[0].url).toBe("http://127.0.0.1:4420");
    expect(openApi.paths["/v1/client/brief"].get.operationId).toBe("clientBrief");
    expect(openApi.paths["/v1/client/demo"].get.operationId).toBe("clientDemo");
    expect(openApi.paths["/v1/data/freshness"].get.operationId).toBe("dataFreshness");
    expect(openApi.paths["/v1/data/refresh-plan"].get.operationId).toBe("dataRefreshPlan");
    expect(openApi.paths["/v1/data/refresh-artifact"].get.operationId).toBe("metadataRefreshArtifact");
    expect(openApi.paths["/v1/verification-manifest"].get.operationId).toBe("verificationManifest");
    expect(openApi.paths["/v1/adapters/repo-mining/readiness"].get.operationId).toBe("repoMiningReadiness");
    expect(openApi.paths["/v1/adapters/trending-signals/readiness"].get.operationId).toBe("trendingSignalsReadiness");
    expect(openApi.paths["/v1/readiness"].get.operationId).toBe("readiness");
    expect(openApi.paths["/v1/operator/next-actions"].get.operationId).toBe("operatorNextActions");
    expect(openApi["x-sapphire-nexus"].liveActionsEnabled).toBe(false);

    const deploymentRes = await app.request("http://127.0.0.1:4420/v1/deployment");
    expect(deploymentRes.status).toBe(200);
    const deployment = await deploymentRes.json();
    expect(deployment.schemaId).toBe("sapphire.nexus.deployment_identity.v1");
    expect(deployment.origin).toBe("http://127.0.0.1:4420");
    expect(deployment.mode.liveActionsEnabled).toBe(false);
    expect(deployment.safety.exposesEnvironmentDump).toBe(false);

    const freshnessRes = await app.request("http://127.0.0.1:4420/v1/data/freshness");
    expect(freshnessRes.status).toBe(200);
    const freshness = await freshnessRes.json();
    expect(freshness.schemaId).toBe("sapphire.nexus.data_freshness.v1");
    expect(freshness.origin).toBe("http://127.0.0.1:4420");
    expect(freshness.summary.status).toBe("ready");
    expect(freshness.summary.datasets).toBeGreaterThan(3);
    expect(freshness.summary.manualRefreshRequiredForCurrentClaims).toBeGreaterThanOrEqual(1);
    expect(freshness.safety.fetchesRemoteSources).toBe(false);
    expect(freshness.policy.currentTrendClaimsRequireManualRefresh).toBe(true);

    const refreshPlanRes = await app.request("http://127.0.0.1:4420/v1/data/refresh-plan");
    expect(refreshPlanRes.status).toBe(200);
    const refreshPlan = await refreshPlanRes.json();
    expect(refreshPlan.schemaId).toBe("sapphire.nexus.data_refresh_plan.v1");
    expect(refreshPlan.origin).toBe("http://127.0.0.1:4420");
    expect(refreshPlan.summary.status).toBe("ready");
    expect(refreshPlan.summary.remoteFetchesPerformed).toBe(false);
    expect(refreshPlan.summary.writesPerformed).toBe(false);
    expect(refreshPlan.safety.writesDataInThisRoute).toBe(false);
    expect(refreshPlan.policy.sourceRightsReviewRequired).toBe(true);

    const refreshArtifactRes = await app.request("http://127.0.0.1:4420/v1/data/refresh-artifact");
    expect(refreshArtifactRes.status).toBe(200);
    const refreshArtifact = await refreshArtifactRes.json();
    expect(refreshArtifact.schemaId).toBe("sapphire.nexus.metadata_refresh_artifact.v1");
    expect(refreshArtifact.origin).toBe("http://127.0.0.1:4420");
    expect(refreshArtifact.summary.status).toBe("ready_for_review");
    expect(refreshArtifact.summary.metadataOnly).toBe(true);
    expect(refreshArtifact.summary.remoteFetchesPerformed).toBe(false);
    expect(refreshArtifact.summary.writesPerformed).toBe(false);
    expect(refreshArtifact.safety.writesDataInThisRoute).toBe(false);
    expect(refreshArtifact.policy.readyForAutomaticWrite).toBe(false);

    const clientDemoRes = await app.request("http://127.0.0.1:4420/v1/client/demo");
    expect(clientDemoRes.status).toBe(200);
    const clientDemo = await clientDemoRes.json();
    expect(clientDemo.schemaId).toBe("sapphire.nexus.client_demo.v1");
    expect(clientDemo.origin).toBe("http://127.0.0.1:4420");
    expect(clientDemo.summary.status).toBe("ready");
    expect(clientDemo.summary.publicRoutesOnly).toBe(true);
    expect(clientDemo.summary.liveActionsEnabled).toBe(false);
    expect(clientDemo.steps.map((step: { route: string }) => step.route)).toContain("/v1/data/freshness");
    expect(clientDemo.safety.mutatesRuntime).toBe(false);
    expect(clientDemo.policy.revisionVerificationRequiredBeforeProductionClaims).toBe(true);

    const clientBriefRes = await app.request("http://127.0.0.1:4420/v1/client/brief");
    expect(clientBriefRes.status).toBe(200);
    const clientBrief = await clientBriefRes.json();
    expect(clientBrief.schemaId).toBe("sapphire.nexus.client_brief.v1");
    expect(clientBrief.product.publicUrl).toBe("http://127.0.0.1:4420");
    expect(clientBrief.productionStatus.liveActionsEnabled).toBe(false);
    expect(clientBrief.safety.rawPayloadsPublished).toBe(false);
    expect(clientBrief.blockedClaims).toContain("production trading");

    const verificationRes = await app.request("http://127.0.0.1:4420/v1/verification-manifest");
    expect(verificationRes.status).toBe(200);
    const verification = await verificationRes.json();
    expect(verification.schemaId).toBe("sapphire.nexus.verification_manifest.v1");
    expect(verification.origin).toBe("http://127.0.0.1:4420");
    expect(verification.summary.productionClaimsRequireRevisionMatch).toBe(true);
    expect(verification.requiredHeaders["x-content-type-options"]).toBe("nosniff");
    expect(verification.safety.mutatesRuntime).toBe(false);

    const landscapeRes = await app.request("/v1/landscape");
    expect(landscapeRes.status).toBe(200);
    const landscape = await landscapeRes.json();
    expect(landscape.schemaId).toBe("sapphire.nexus.landscape.v1");

    const ledgerRes = await app.request("/v1/evidence-ledger");
    expect(ledgerRes.status).toBe(200);
    const ledger = await ledgerRes.json();
    expect(ledger.schemaId).toBe("sapphire.nexus.evidence_ledger.v1");
    expect(ledger.safety.rawPayloadsStored).toBe(false);

    const repoMiningRes = await app.request("/v1/adapters/repo-mining/readiness");
    expect(repoMiningRes.status).toBe(200);
    const repoMining = await repoMiningRes.json();
    expect(repoMining.schemaId).toBe("sapphire.nexus.adapter.repo_mining.v1");
    expect(repoMining.summary.status).toBe("ready");
    expect(repoMining.safety.fetchesRemoteSources).toBe(false);
    expect(repoMining.safety.deletesSourceRepos).toBe(false);

    const trendingSignalsRes = await app.request("/v1/adapters/trending-signals/readiness");
    expect(trendingSignalsRes.status).toBe(200);
    const trendingSignals = await trendingSignalsRes.json();
    expect(trendingSignals.schemaId).toBe("sapphire.nexus.adapter.trending_signals.v1");
    expect(trendingSignals.summary.status).toBe("ready");
    expect(trendingSignals.summary.currentTrendClaimsAllowed).toBe(false);
    expect(trendingSignals.safety.fetchesRemoteSources).toBe(false);

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

    const nextActionsRes = await app.request("/v1/operator/next-actions");
    expect(nextActionsRes.status).toBe(200);
    const nextActions = await nextActionsRes.json();
    expect(nextActions.schemaId).toBe("sapphire.nexus.operator_next_actions.v1");
    expect(nextActions.summary.liveActionsEnabled).toBe(false);
    expect(nextActions.summary.agentSafe).toBe(3);
    expect(nextActions.summary.ariDecision).toBe(2);
    expect(nextActions.safety.mutatesRuntime).toBe(false);
    expect(nextActions.actions.map((action: { route: string | null }) => action.route)).toContain("/v1/data/refresh-artifact");
    expect(nextActions.actions.map((action: { lane: string }) => action.lane)).toContain("ari-only");
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
