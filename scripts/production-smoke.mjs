const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error("usage: npm run smoke:production -- https://deployment-url");
  process.exit(2);
}

const expectedOrigin = new URL(baseUrl).origin;
const expectedRevision = process.env.SAPPHIRE_NEXUS_EXPECTED_REVISION;
const requiredHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
};

const checks = [
  { id: "health", path: "/health", validate: (body) => body.status === "ok" && body.liveActionsEnabled === false },
  {
    id: "discovery",
    path: "/.well-known/sapphire-nexus.json",
    validate: (body) =>
      body.origin === expectedOrigin &&
      body.routes?.readiness === "/v1/readiness" &&
      body.routes?.deployment === "/v1/deployment" &&
      body.routes?.dataFreshness === "/v1/data/freshness" &&
      body.routes?.dataRefreshPlan === "/v1/data/refresh-plan" &&
      body.routes?.clientBrief === "/v1/client/brief" &&
      body.routes?.verificationManifest === "/v1/verification-manifest" &&
      body.routes?.repoMiningReadiness === "/v1/adapters/repo-mining/readiness" &&
      body.routes?.trendingSignalsReadiness === "/v1/adapters/trending-signals/readiness" &&
      body.routes?.openApi === "/openapi.json" &&
      body.routes?.operatorNextActions === "/v1/operator/next-actions",
  },
  {
    id: "openapi",
    path: "/openapi.json",
    validate: (body) =>
      body.openapi === "3.1.0" &&
      body.servers?.[0]?.url === expectedOrigin &&
      body.paths?.["/v1/client/brief"]?.get?.operationId === "clientBrief" &&
      body.paths?.["/v1/data/freshness"]?.get?.operationId === "dataFreshness" &&
      body.paths?.["/v1/data/refresh-plan"]?.get?.operationId === "dataRefreshPlan" &&
      body.paths?.["/v1/verification-manifest"]?.get?.operationId === "verificationManifest" &&
      body.paths?.["/v1/adapters/repo-mining/readiness"]?.get?.operationId === "repoMiningReadiness" &&
      body.paths?.["/v1/adapters/trending-signals/readiness"]?.get?.operationId === "trendingSignalsReadiness" &&
      body.paths?.["/v1/readiness"]?.get?.operationId === "readiness" &&
      body.paths?.["/v1/operator/next-actions"]?.get?.operationId === "operatorNextActions" &&
      body["x-sapphire-nexus"]?.liveActionsEnabled === false,
  },
  {
    id: "deployment",
    path: "/v1/deployment",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.deployment_identity.v1" &&
      body.origin === expectedOrigin &&
      (expectedRevision ? body.runtime?.revision === expectedRevision : true) &&
      body.mode?.liveActionsEnabled === false &&
      body.safety?.readsSecrets === false &&
      body.safety?.exposesEnvironmentDump === false,
    detail: (body) => ({ revision: body.runtime?.revision ?? null, expectedRevision: expectedRevision ?? null }),
  },
  {
    id: "dataFreshness",
    path: "/v1/data/freshness",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.data_freshness.v1" &&
      body.origin === expectedOrigin &&
      body.summary?.status === "ready" &&
      body.summary?.manualRefreshRequiredForCurrentClaims >= 1 &&
      body.safety?.fetchesRemoteSources === false &&
      body.policy?.currentTrendClaimsRequireManualRefresh === true,
  },
  {
    id: "dataRefreshPlan",
    path: "/v1/data/refresh-plan",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.data_refresh_plan.v1" &&
      body.origin === expectedOrigin &&
      body.summary?.status === "ready" &&
      body.summary?.remoteFetchesPerformed === false &&
      body.summary?.writesPerformed === false &&
      body.safety?.writesDataInThisRoute === false &&
      body.policy?.sourceRightsReviewRequired === true,
  },
  {
    id: "clientBrief",
    path: "/v1/client/brief",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.client_brief.v1" &&
      body.product?.publicUrl === expectedOrigin &&
      body.productionStatus?.liveActionsEnabled === false &&
      body.safety?.rawPayloadsPublished === false,
  },
  {
    id: "verificationManifest",
    path: "/v1/verification-manifest",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.verification_manifest.v1" &&
      body.origin === expectedOrigin &&
      body.summary?.productionClaimsRequireRevisionMatch === true &&
      body.requiredHeaders?.["x-content-type-options"] === "nosniff" &&
      body.safety?.requiresPrivateNetwork === false,
  },
  {
    id: "readiness",
    path: "/v1/readiness",
    validate: (body) => body.schemaId === "sapphire.nexus.readiness.v1" && body.safety?.liveActionsEnabled === false,
  },
  {
    id: "repoMining",
    path: "/v1/adapters/repo-mining/readiness",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.adapter.repo_mining.v1" &&
      body.summary?.status === "ready" &&
      body.safety?.fetchesRemoteSources === false &&
      body.safety?.deletesSourceRepos === false &&
      body.policy?.protectedProductsStaySeparate === true,
  },
  {
    id: "trendingSignals",
    path: "/v1/adapters/trending-signals/readiness",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.adapter.trending_signals.v1" &&
      body.summary?.status === "ready" &&
      body.summary?.currentTrendClaimsAllowed === false &&
      body.safety?.fetchesRemoteSources === false &&
      body.policy?.refreshRequiredBeforeClientTrendClaims === true,
  },
  {
    id: "publicSources",
    path: "/v1/adapters/public-sources/readiness",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.adapter.public_sources.v1" &&
      body.summary?.status === "ready" &&
      body.safety?.rawPayloadsStored === false,
  },
  {
    id: "operatorNextActions",
    path: "/v1/operator/next-actions",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.operator_next_actions.v1" &&
      body.summary?.agentSafe === 2 &&
      body.summary?.ariDecision === 2 &&
      body.safety?.mutatesRuntime === false,
  },
  {
    id: "workbench",
    path: "/",
    validateText: (text) =>
      text.includes("Sapphire Nexus") &&
      text.includes("Readiness") &&
      text.includes("Deployment Identity") &&
      text.includes("Client Brief") &&
      text.includes("/v1/client/brief") &&
      text.includes("Data Freshness") &&
      text.includes("/v1/data/freshness") &&
      text.includes("Refresh Plan") &&
      text.includes("/v1/data/refresh-plan") &&
      text.includes("Verification") &&
      text.includes("/v1/verification-manifest") &&
      text.includes("API Surface") &&
      text.includes("/openapi.json") &&
      text.includes("/v1/adapters/repo-mining/readiness") &&
      text.includes("/v1/adapters/trending-signals/readiness") &&
      text.includes("Next Actions") &&
      text.includes("/v1/operator/next-actions"),
  },
  {
    id: "llms",
    path: "/llms.txt",
    validateText: (text) =>
      text.includes("Sapphire Nexus") && text.includes(expectedOrigin) && text.includes("live actions disabled"),
  },
  {
    id: "robots",
    path: "/robots.txt",
    validateText: (text) => text.includes("User-agent: *") && text.includes(`llms.txt: ${expectedOrigin}/llms.txt`),
  },
];

const results = [];
for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { accept: check.validateText ? "text/plain, text/html" : "application/json" } });
    const elapsedMs = Date.now() - started;
    const headersOk = Object.entries(requiredHeaders).every(([name, expected]) => response.headers.get(name) === expected);
    if (check.validateText) {
      const text = await response.text();
      results.push({ id: check.id, status: response.status, ok: response.ok && headersOk && check.validateText(text), headersOk, elapsedMs });
    } else {
      const body = await response.json();
      results.push({
        id: check.id,
        status: response.status,
        ok: response.ok && headersOk && check.validate(body),
        headersOk,
        elapsedMs,
        ...(check.detail ? { detail: check.detail(body) } : {}),
      });
    }
  } catch (error) {
    results.push({ id: check.id, status: null, ok: false, elapsedMs: Date.now() - started, error: error.name });
  }
}

const ok = results.every((result) => result.ok);
console.log(JSON.stringify({ ok, baseUrl, expectedRevision: expectedRevision ?? null, results }, null, 2));
if (!ok) {
  process.exit(1);
}
