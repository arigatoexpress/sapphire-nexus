import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AOE_ADAPTER_READINESS_SCHEMA_ID } from "./adapters/aoe.js";
import { AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID } from "./adapters/agent-runtime.js";
import { DEPLOYMENT_IDENTITY_SCHEMA_ID, isPublicDeployment, publicDeploymentReason } from "./deployment.js";
import { EVIDENCE_LEDGER_SCHEMA_ID, buildEvidenceLedger } from "./evidence.js";
import { PUBLIC_RESPONSE_HEADERS } from "./response-headers.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const HEALTH_SCHEMA_ID = "sapphire.nexus.health.v1";
export const WELL_KNOWN_SCHEMA_ID = "sapphire.nexus.discovery.v1";
export const THESIS_SCHEMA_ID = "sapphire.nexus.thesis.v1";
export const LANDSCAPE_SCHEMA_ID = "sapphire.nexus.landscape.v1";
export const NEXUS_READINESS_SCHEMA_ID = "sapphire.nexus.readiness.v1";
export const MODEL_GATEWAY_SCHEMA_ID = "sapphire.nexus.model_gateway.v1";
export const MODEL_GATEWAY_READINESS_SCHEMA_ID = "sapphire.nexus.model_gateway_readiness.v1";
export const MODEL_PROMPT_SMOKE_SCHEMA_ID = "sapphire.nexus.model_prompt_smoke.v1";
export const MARKET_RESEARCH_SCHEMA_ID = "sapphire.nexus.market_research_posture.v1";
export const OPERATOR_NEXT_ACTIONS_SCHEMA_ID = "sapphire.nexus.operator_next_actions.v1";
export const CLIENT_BRIEF_SCHEMA_ID = "sapphire.nexus.client_brief.v1";
export const CLIENT_DEMO_SCHEMA_ID = "sapphire.nexus.client_demo.v1";
export const CLIENT_CLAIM_READINESS_SCHEMA_ID = "sapphire.nexus.client_claim_readiness.v1";
export const VERIFICATION_MANIFEST_SCHEMA_ID = "sapphire.nexus.verification_manifest.v1";
export const DATA_FRESHNESS_SCHEMA_ID = "sapphire.nexus.data_freshness.v1";
export const DATA_REFRESH_PLAN_SCHEMA_ID = "sapphire.nexus.data_refresh_plan.v1";
export const METADATA_REFRESH_ARTIFACT_SCHEMA_ID = "sapphire.nexus.metadata_refresh_artifact.v1";
export const DATA_REVIEW_QUEUE_SCHEMA_ID = "sapphire.nexus.data_review_queue.v1";
const FIXED_PROMPT_SMOKE_PROMPT = "Return exactly the token NEXUS_OK.";

const LandscapeSchema = z.object({
  schemaId: z.literal(LANDSCAPE_SCHEMA_ID),
  generatedAt: z.string(),
  method: z.string(),
  principles: z.array(z.string()),
  ownedRepoSignals: z.array(
    z.object({
      repo: z.string(),
      role: z.string(),
      mine: z.array(z.string()),
      avoid: z.array(z.string()),
    }),
  ),
  openSourceShortlist: z.array(
    z.object({
      repo: z.string(),
      category: z.string(),
      stars: z.number(),
      license: z.string(),
      fit: z.string(),
    }),
  ),
  trendingSignals: z.array(
    z.object({
      repo: z.string(),
      starsThisWeek: z.number(),
      fit: z.string(),
    }),
  ),
  protectedLanes: z.array(z.string()),
  notCore: z
    .array(
      z.object({
        repo: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
});

export type Landscape = z.infer<typeof LandscapeSchema>;

export function loadLandscape(path = resolve(repoRoot, "data/landscape.json")): Landscape {
  return LandscapeSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

export function buildHealth(now = new Date()) {
  return {
    schemaId: HEALTH_SCHEMA_ID,
    service: "sapphire-nexus",
    generatedAt: now.toISOString(),
    status: "ok",
    liveActionsEnabled: false,
    protectedScopes: ["THO", "Project-Go-Forward", "0guard", "wildfire-watch", "hackathon submissions"],
  };
}

export function buildWellKnown(origin: string) {
  return {
    schemaId: WELL_KNOWN_SCHEMA_ID,
    service: "sapphire-nexus",
    origin,
    routes: {
      health: "/health",
      openApi: "/openapi.json",
      llmsTxt: "/llms.txt",
      robotsTxt: "/robots.txt",
      deployment: "/v1/deployment",
      dataFreshness: "/v1/data/freshness",
      dataRefreshPlan: "/v1/data/refresh-plan",
      metadataRefreshArtifact: "/v1/data/refresh-artifact",
      dataReviewQueue: "/v1/data/review-queue",
      clientDemo: "/v1/client/demo",
      clientClaimReadiness: "/v1/client/claim-readiness",
      thesis: "/v1/thesis",
      landscape: "/v1/landscape",
      readiness: "/v1/readiness",
      evidenceLedger: "/v1/evidence-ledger",
      repoMiningReadiness: "/v1/adapters/repo-mining/readiness",
      trendingSignalsReadiness: "/v1/adapters/trending-signals/readiness",
      publicSourcesReadiness: "/v1/adapters/public-sources/readiness",
      aoeReadiness: "/v1/adapters/aoe/readiness",
      agentRuntimePublication: "/v1/adapters/agent-runtime/publication",
      modelGateway: "/v1/model-gateway",
      modelGatewayReadiness: "/v1/model-gateway/readiness",
      modelPromptSmoke: "/v1/model-gateway/prompt-smoke",
      marketResearchPosture: "/v1/market/research-posture",
      operatorNextActions: "/v1/operator/next-actions",
      clientBrief: "/v1/client/brief",
      verificationManifest: "/v1/verification-manifest",
    },
    schemaIds: {
      health: HEALTH_SCHEMA_ID,
      openApi: "sapphire.nexus.openapi.v1",
      deployment: DEPLOYMENT_IDENTITY_SCHEMA_ID,
      dataFreshness: DATA_FRESHNESS_SCHEMA_ID,
      dataRefreshPlan: DATA_REFRESH_PLAN_SCHEMA_ID,
      metadataRefreshArtifact: METADATA_REFRESH_ARTIFACT_SCHEMA_ID,
      dataReviewQueue: DATA_REVIEW_QUEUE_SCHEMA_ID,
      clientDemo: CLIENT_DEMO_SCHEMA_ID,
      clientClaimReadiness: CLIENT_CLAIM_READINESS_SCHEMA_ID,
      thesis: THESIS_SCHEMA_ID,
      landscape: LANDSCAPE_SCHEMA_ID,
      readiness: NEXUS_READINESS_SCHEMA_ID,
      evidenceLedger: EVIDENCE_LEDGER_SCHEMA_ID,
      repoMiningReadiness: "sapphire.nexus.adapter.repo_mining.v1",
      trendingSignalsReadiness: "sapphire.nexus.adapter.trending_signals.v1",
      publicSourcesReadiness: "sapphire.nexus.adapter.public_sources.v1",
      aoeReadiness: AOE_ADAPTER_READINESS_SCHEMA_ID,
      agentRuntimePublication: AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID,
      modelGateway: MODEL_GATEWAY_SCHEMA_ID,
      modelGatewayReadiness: MODEL_GATEWAY_READINESS_SCHEMA_ID,
      modelPromptSmoke: MODEL_PROMPT_SMOKE_SCHEMA_ID,
      marketResearchPosture: MARKET_RESEARCH_SCHEMA_ID,
      operatorNextActions: OPERATOR_NEXT_ACTIONS_SCHEMA_ID,
      clientBrief: CLIENT_BRIEF_SCHEMA_ID,
      verificationManifest: VERIFICATION_MANIFEST_SCHEMA_ID,
    },
    safety: buildSafetyBoundary(),
  };
}

export function buildThesis(landscape = loadLandscape()) {
  return {
    schemaId: THESIS_SCHEMA_ID,
    title: "Sapphire Nexus",
    oneLine: "A local-first intelligence kernel for Ari's AI, quant, market, and runtime evidence.",
    generatedAt: new Date().toISOString(),
    principles: landscape.principles,
    preserveAsProducts: landscape.protectedLanes,
    mineForParts: landscape.ownedRepoSignals.map((repo) => ({
      repo: repo.repo,
      role: repo.role,
      mine: repo.mine,
      avoid: repo.avoid,
    })),
    architecture: [
      "typed Hono API",
      "source-rights evidence ledger",
      "local model gateway contract",
      "paper-only market research adapters",
      "operator workbench",
    ],
    blockedClaims: buildBlockedClaims(),
  };
}

export function buildOperatorNextActions(now = new Date()) {
  const actions = [
    {
      id: "verify-live-surface",
      lane: "agent-safe",
      label: "Verify the live Cloud Run URL before production claims",
      status: "ready",
      route: "/v1/deployment",
      approvalRequired: false,
      reason: "Revision identity and smoke checks already exist and are safe to rerun.",
    },
    {
      id: "client-claim-readiness",
      lane: "agent-safe",
      label: "Check client claim readiness before demos or public claims",
      status: "ready",
      route: "/v1/client/claim-readiness",
      approvalRequired: false,
      reason: "The route shows when checked-in metadata needs review before current client claims.",
    },
    {
      id: "metadata-refresh-artifact",
      lane: "agent-safe",
      label: "Review the metadata refresh artifact before updating checked-in data",
      status: "ready",
      route: "/v1/data/refresh-artifact",
      approvalRequired: false,
      reason: "The artifact is metadata-only and separates refresh evidence from any future data write.",
    },
    {
      id: "data-review-queue",
      lane: "agent-safe",
      label: "Use the review queue to prioritize claim-blocking metadata reviews",
      status: "ready",
      route: "/v1/data/review-queue",
      approvalRequired: false,
      reason: "The queue turns stale checked-in metadata into source-rights review work without fetching or writing data.",
    },
    {
      id: "rights-cleared-adapter",
      lane: "agent-safe",
      label: "Add the next rights-cleared adapter from explicit public metadata",
      status: "candidate",
      route: "/v1/adapters/public-sources/readiness",
      approvalRequired: false,
      reason: "Only derived summaries, links, hashes, and checked-in metadata are allowed.",
    },
    {
      id: "custom-domain-choice",
      lane: "ari-only",
      label: "Choose DNS/domain before custom domain setup",
      status: "blocked",
      route: null,
      approvalRequired: true,
      reason: "Domain mapping changes DNS and should wait for Ari's named domain choice.",
    },
    {
      id: "deploy-promotion-policy",
      lane: "ari-only",
      label: "Choose manual versus auto-promote deploy workflow",
      status: "blocked",
      route: null,
      approvalRequired: true,
      reason: "Automation should not change production promotion policy without an explicit decision.",
    },
  ];

  return {
    schemaId: OPERATOR_NEXT_ACTIONS_SCHEMA_ID,
    generatedAt: now.toISOString(),
    summary: {
      actions: actions.length,
      agentSafe: actions.filter((action) => action.lane === "agent-safe").length,
      ariDecision: actions.filter((action) => action.approvalRequired).length,
      blocked: actions.filter((action) => action.status === "blocked").length,
      liveActionsEnabled: false,
    },
    actions,
    safety: {
      ...buildSafetyBoundary(),
      readsSecrets: false,
      mutatesRuntime: false,
      sendsExternalMessages: false,
      storesRawPayloads: false,
    },
    policy: {
      publicSafe: true,
      reversibleCodeChangesOnly: true,
      requiresVerificationBeforeProductionClaims: true,
      ariDecisionRequiredForDomainOrPromotionPolicy: true,
    },
  };
}

export function buildClientBrief(origin: string, landscape = loadLandscape(), now = new Date()) {
  return {
    schemaId: CLIENT_BRIEF_SCHEMA_ID,
    generatedAt: now.toISOString(),
    product: {
      name: "Sapphire Nexus",
      publicUrl: origin,
      oneLine: "A read-only intelligence workbench for source-linked research, readiness, and operator evidence.",
      audience: ["clients", "operators", "reviewers"],
    },
    productionStatus: {
      publicSurface: "live",
      clientSafe: true,
      liveActionsEnabled: false,
      verifiedBy: [
        "/health",
        "/v1/readiness",
        "/v1/deployment",
        "/v1/data/freshness",
        "/v1/data/refresh-plan",
        "/v1/data/refresh-artifact",
        "/v1/data/review-queue",
        "/v1/client/claim-readiness",
        "/v1/client/demo",
        "/openapi.json",
        "/v1/verification-manifest",
      ],
    },
    capabilities: [
      {
        label: "Public readiness",
        status: "live",
        route: "/v1/readiness",
        clientValue: "Shows whether the public surface is usable without exposing private systems.",
      },
      {
        label: "Source-rights posture",
        status: "live",
        route: "/v1/adapters/public-sources/readiness",
        clientValue: "Separates reusable public metadata from reference-only sources.",
      },
      {
        label: "Evidence ledger",
        status: "live",
        route: "/v1/evidence-ledger",
        clientValue: "Publishes derived summaries, links, provenance, and stable hashes instead of raw payload dumps.",
      },
      {
        label: "Data freshness",
        status: "live",
        route: "/v1/data/freshness",
        clientValue: "Shows which checked-in snapshots need refresh before current client claims.",
      },
      {
        label: "Refresh plan",
        status: "live",
        route: "/v1/data/refresh-plan",
        clientValue: "Shows the reviewed metadata-only path for refreshing stale public claims.",
      },
      {
        label: "Refresh artifact",
        status: "live",
        route: "/v1/data/refresh-artifact",
        clientValue: "Packages the checked-in refresh evidence for source-rights review before metadata writes.",
      },
      {
        label: "Review queue",
        status: "live",
        route: "/v1/data/review-queue",
        clientValue: "Prioritizes claim-blocking metadata reviews without fetching sources or writing data.",
      },
      {
        label: "Claim readiness",
        status: "live",
        route: "/v1/client/claim-readiness",
        clientValue: "Shows whether freshness and revision gates allow current client claims.",
      },
      {
        label: "Demo flow",
        status: "live",
        route: "/v1/client/demo",
        clientValue: "Provides a route-linked, claim-safe walkthrough for clients and operators.",
      },
      {
        label: "Local model gateway",
        status: "disabled-in-public",
        route: "/v1/model-gateway/readiness",
        clientValue: "Keeps local inference private until explicitly enabled and verified.",
      },
    ],
    protectedBoundaries: landscape.protectedLanes,
    blockedClaims: buildBlockedClaims(),
    safety: {
      ...buildSafetyBoundary(),
      rawPayloadsPublished: false,
      clientSendsAllowed: false,
      promisesProductionTrading: false,
      exposesPrivateInfrastructure: false,
    },
  };
}

export function buildVerificationManifest(origin: string, now = new Date()) {
  const checks = [
    { id: "health", route: "/health", proves: "service is reachable and live actions are disabled" },
    { id: "discovery", route: "/.well-known/sapphire-nexus.json", proves: "public route map and schema ids are discoverable" },
    { id: "openapi", route: "/openapi.json", proves: "client-readable API contract is published" },
    { id: "deployment", route: "/v1/deployment", proves: "safe Cloud Run revision identity is visible" },
    { id: "dataFreshness", route: "/v1/data/freshness", proves: "checked-in data freshness is explicit before client claims" },
    { id: "dataRefreshPlan", route: "/v1/data/refresh-plan", proves: "metadata refreshes have a source-rights review path" },
    { id: "metadataRefreshArtifact", route: "/v1/data/refresh-artifact", proves: "refresh review evidence is metadata-only and source-rights gated" },
    { id: "dataReviewQueue", route: "/v1/data/review-queue", proves: "claim-blocking metadata reviews are prioritized without writes" },
    { id: "clientClaimReadiness", route: "/v1/client/claim-readiness", proves: "client-current claims are gated on freshness and revision review" },
    { id: "clientDemo", route: "/v1/client/demo", proves: "client walkthrough is public, route-linked, and claim-safe" },
    { id: "clientBrief", route: "/v1/client/brief", proves: "client-safe summary is public and non-hype" },
    { id: "verificationManifest", route: "/v1/verification-manifest", proves: "verification contract is public and self-describing" },
    { id: "readiness", route: "/v1/readiness", proves: "public readiness rollup is usable" },
    { id: "repoMining", route: "/v1/adapters/repo-mining/readiness", proves: "owned repo mining stays contract-only" },
    { id: "trendingSignals", route: "/v1/adapters/trending-signals/readiness", proves: "trend snapshots are caveated and metadata-only" },
    { id: "publicSources", route: "/v1/adapters/public-sources/readiness", proves: "source-rights posture is explicit" },
    { id: "operatorNextActions", route: "/v1/operator/next-actions", proves: "agent-safe and Ari-only lanes are separated" },
    { id: "workbench", route: "/", proves: "operator UI renders the public-safe panels" },
    { id: "llms", route: "/llms.txt", proves: "AI-readable public guide is available" },
    { id: "robots", route: "/robots.txt", proves: "crawler guidance points at llms.txt" },
  ];

  return {
    schemaId: VERIFICATION_MANIFEST_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      checks: checks.length,
      requiredHeaders: Object.keys(PUBLIC_RESPONSE_HEADERS).length,
      liveActionsEnabled: false,
      productionClaimsRequireRevisionMatch: true,
    },
    checks,
    requiredHeaders: PUBLIC_RESPONSE_HEADERS,
    commands: {
      productionSmoke: "SAPPHIRE_NEXUS_EXPECTED_REVISION=<revision> node scripts/production-smoke.mjs <public-url>",
      revisionSource: "/v1/deployment",
    },
    safety: {
      ...buildSafetyBoundary(),
      mutatesRuntime: false,
      readsSecrets: false,
      sendsExternalMessages: false,
      requiresPrivateNetwork: false,
    },
  };
}

export function buildLandscapeEvidenceLedger(landscape = loadLandscape()) {
  return buildEvidenceLedger(landscape);
}

export function buildModelGateway(env = process.env) {
  const ollamaUrl = env.SAPPHIRE_NEXUS_OLLAMA_URL ?? "http://127.0.0.1:11434";
  const windowsGpuUrl = env.SAPPHIRE_NEXUS_WINDOWS_GPU_URL ?? "http://192.168.1.61:9090";

  return {
    schemaId: MODEL_GATEWAY_SCHEMA_ID,
    generatedAt: new Date().toISOString(),
    gateways: [
      {
        id: "ollama-local",
        role: "current local inference default",
        baseUrl: ollamaUrl,
        protocol: "ollama",
        requiredBeforeUse: ["health readback", "model list readback", "prompt smoke"],
      },
      {
        id: "windows-gpu",
        role: "future high-throughput local AI server",
        baseUrl: windowsGpuUrl,
        protocol: "openai-compatible-or-ollama-compatible",
        requiredBeforeUse: ["network reachability", "GPU inventory", "model-serving health", "no-secret config review"],
      },
    ],
    policy: {
      storesPromptsByDefault: false,
      readsSecrets: false,
      canTrainModels: false,
      trainingRequiresExplicitDatasetPlan: true,
      promptSmokeRequiresExplicitEnable: true,
      promptSmokeStoresPromptOrCompletion: false,
      cloudFallbackAllowed: "only after local verification and source-rights review",
    },
  };
}

export async function checkModelGatewayReadiness(options: {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: Date;
} = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 1_500;
  const modelGateway = buildModelGateway(env);
  if (isPublicDeployment(env)) {
    return {
      schemaId: MODEL_GATEWAY_READINESS_SCHEMA_ID,
      generatedAt: (options.now ?? new Date()).toISOString(),
      safety: {
        readsSecrets: false,
        sendsPrompts: false,
        startsTraining: false,
        mutatesRuntime: false,
        liveTradingAllowed: false,
      },
      summary: {
        gateways: modelGateway.gateways.length,
        ready: 0,
        degraded: 0,
        disabled: modelGateway.gateways.length,
        reason: publicDeploymentReason(),
      },
      gateways: modelGateway.gateways.map((gateway) => ({
        id: gateway.id,
        role: gateway.role,
        url: gateway.baseUrl,
        reachable: false,
        status: "disabled",
        statusCode: null,
        durationMs: 0,
        detail: {
          reason: publicDeploymentReason(),
        },
      })),
    };
  }

  const gatewayReadiness = await Promise.all(
    modelGateway.gateways.map(async (gateway) => {
      const probePath = gateway.id === "ollama-local" ? "/api/tags" : "/health";
      const url = `${gateway.baseUrl.replace(/\/$/, "")}${probePath}`;
      const started = Date.now();
      try {
        const response = await fetchWithTimeout(fetchImpl, url, timeoutMs);
        const durationMs = Date.now() - started;
        let detail: Record<string, unknown> = {};
        if (response.ok) {
          detail = await safeJson(response);
        }
        return {
          id: gateway.id,
          role: gateway.role,
          url,
          reachable: response.ok,
          status: response.ok ? "ready" : "unhealthy",
          statusCode: response.status,
          durationMs,
          detail: gateway.id === "ollama-local" ? summarizeOllama(detail) : summarizeGenericHealth(detail),
        };
      } catch (error) {
        return {
          id: gateway.id,
          role: gateway.role,
          url,
          reachable: false,
          status: "unreachable",
          statusCode: null,
          durationMs: Date.now() - started,
          detail: {
            error: error instanceof Error ? error.name : "unknown_error",
          },
        };
      }
    }),
  );

  return {
    schemaId: MODEL_GATEWAY_READINESS_SCHEMA_ID,
    generatedAt: (options.now ?? new Date()).toISOString(),
    safety: {
      readsSecrets: false,
      sendsPrompts: false,
      startsTraining: false,
      mutatesRuntime: false,
      liveTradingAllowed: false,
    },
    summary: {
      gateways: gatewayReadiness.length,
      ready: gatewayReadiness.filter((gateway) => gateway.status === "ready").length,
      degraded: gatewayReadiness.filter((gateway) => gateway.status !== "ready").length,
    },
    gateways: gatewayReadiness,
  };
}

export async function checkModelPromptSmoke(options: {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: Date;
} = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 3_000;
  const ollamaUrl = env.SAPPHIRE_NEXUS_OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = env.SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL;
  const enabled = parseBoolean(env.SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED) === true;
  const url = `${ollamaUrl.replace(/\/$/, "")}/api/generate`;
  const enabledInThisRuntime = enabled && !isPublicDeployment(env);
  const safety = buildPromptSmokeSafety(enabledInThisRuntime);

  const base = {
    schemaId: MODEL_PROMPT_SMOKE_SCHEMA_ID,
    generatedAt: (options.now ?? new Date()).toISOString(),
    mode: "fixed_prompt_healthcheck",
    policy: {
      enabled: enabledInThisRuntime,
      requiresExplicitEnable: true,
      requiresExplicitModel: true,
      cloudFallbackAllowed: false,
      promptTextReturned: false,
      completionTextReturned: false,
      promptHash: hashText(FIXED_PROMPT_SMOKE_PROMPT),
    },
    gateway: {
      id: "ollama-local",
      url,
      model: model ?? null,
    },
    safety,
  };

  if (isPublicDeployment(env)) {
    return {
      ...base,
      summary: { status: "disabled", ready: false, reason: publicDeploymentReason() },
      result: null,
    };
  }

  if (!enabled) {
    return {
      ...base,
      summary: { status: "disabled", ready: false, reason: "SAPPHIRE_NEXUS_PROMPT_SMOKE_ENABLED is not true" },
      result: null,
    };
  }

  if (!model) {
    return {
      ...base,
      summary: { status: "blocked", ready: false, reason: "SAPPHIRE_NEXUS_PROMPT_SMOKE_MODEL is required" },
      result: null,
    };
  }

  const started = Date.now();
  try {
    const response = await fetchWithTimeout(fetchImpl, url, timeoutMs, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: FIXED_PROMPT_SMOKE_PROMPT,
        stream: false,
        options: {
          temperature: 0,
          num_predict: 8,
        },
      }),
    });
    const durationMs = Date.now() - started;
    const detail = response.ok ? await safeJson(response) : {};
    const completion = typeof detail.response === "string" ? detail.response : "";
    const completionReturned = completion.length > 0;
    const matched = /\bNEXUS_OK\b/.test(completion);
    return {
      ...base,
      summary: {
        status: response.ok && completionReturned ? "ready" : "degraded",
        ready: response.ok && completionReturned,
        reason: response.ok ? "fixed prompt returned completion" : "ollama prompt smoke returned non-2xx",
      },
      result: {
        statusCode: response.status,
        durationMs,
        completionReturned,
        completionMatched: matched,
        completionChars: completion.length,
        responseDone: typeof detail.done === "boolean" ? detail.done : null,
      },
    };
  } catch (error) {
    return {
      ...base,
      summary: { status: "unreachable", ready: false, reason: "ollama prompt smoke request failed" },
      result: {
        statusCode: null,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.name : "unknown_error",
      },
    };
  }
}

export function buildMarketResearchPosture() {
  return {
    schemaId: MARKET_RESEARCH_SCHEMA_ID,
    generatedAt: new Date().toISOString(),
    mode: "research_only",
    liveTradingAllowed: false,
    orderSigningAllowed: false,
    moneyMovementAllowed: false,
    personalizedAdviceAllowed: false,
    allowedOutputs: ["market context", "source-linked research notes", "paper signal experiments", "backtest reports"],
    blockedOutputs: ["buy/sell/hold advice", "price targets", "live execution", "autonomous portfolio changes"],
    candidateLibraries: ["microsoft/qlib", "polakowo/vectorbt", "OpenBB-finance/OpenBB", "freqtrade/freqtrade"],
  };
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value = await response.json();
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function summarizeOllama(detail: Record<string, unknown>) {
  const models = Array.isArray(detail.models) ? detail.models : [];
  return {
    modelCount: models.length,
    modelNames: models
      .map((model) => (typeof model === "object" && model !== null && "name" in model ? String(model.name) : null))
      .filter((value): value is string => Boolean(value))
      .slice(0, 12),
  };
}

function summarizeGenericHealth(detail: Record<string, unknown>) {
  return {
    status: typeof detail.status === "string" ? detail.status : "unknown",
    service: typeof detail.service === "string" ? detail.service : "unknown",
  };
}

function parseBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }
  return ["1", "true", "yes"].includes(value.toLowerCase());
}

function hashText(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function buildPromptSmokeSafety(enabled: boolean) {
  return {
    readsSecrets: false,
    sendsUserPrompts: false,
    sendsFixedHealthcheckPrompt: enabled,
    storesPrompts: false,
    storesCompletions: false,
    returnsPromptText: false,
    returnsCompletionText: false,
    startsTraining: false,
    mutatesRuntime: false,
    cloudFallbackAllowed: false,
    liveTradingAllowed: false,
  };
}

export function buildSafetyBoundary() {
  return {
    liveTradingAllowed: false,
    paymentSettlementAllowed: false,
    walletSigningAllowed: false,
    telegramSendsAllowed: false,
    customerSendsAllowed: false,
    productionInfraMutationAllowed: false,
    secretValueHandlingAllowed: false,
  };
}

export function buildBlockedClaims() {
  return [
    "production trading",
    "investment advice",
    "wallet signing",
    "payment settlement",
    "Telegram delivery",
    "customer messaging",
    "production infrastructure mutation",
    "THO or Project-Go-Forward ownership",
  ];
}

export function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const host = firstForwardedValue(request.headers.get("x-forwarded-host")) ?? url.host;
  const protocol = firstForwardedValue(request.headers.get("x-forwarded-proto")) ?? url.protocol.replace(":", "");
  return `${safeProtocol(protocol)}://${safeHost(host, url.host)}`;
}

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function safeProtocol(protocol: string) {
  return protocol === "https" || protocol === "http" ? protocol : "https";
}

function safeHost(host: string, fallback: string) {
  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) ? host : fallback;
}
