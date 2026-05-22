import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { EVIDENCE_LEDGER_SCHEMA_ID, buildEvidenceLedger } from "./evidence.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const HEALTH_SCHEMA_ID = "sapphire.nexus.health.v1";
export const WELL_KNOWN_SCHEMA_ID = "sapphire.nexus.discovery.v1";
export const THESIS_SCHEMA_ID = "sapphire.nexus.thesis.v1";
export const LANDSCAPE_SCHEMA_ID = "sapphire.nexus.landscape.v1";
export const MODEL_GATEWAY_SCHEMA_ID = "sapphire.nexus.model_gateway.v1";
export const MODEL_GATEWAY_READINESS_SCHEMA_ID = "sapphire.nexus.model_gateway_readiness.v1";
export const MARKET_RESEARCH_SCHEMA_ID = "sapphire.nexus.market_research_posture.v1";

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
      thesis: "/v1/thesis",
      landscape: "/v1/landscape",
      evidenceLedger: "/v1/evidence-ledger",
      modelGateway: "/v1/model-gateway",
      modelGatewayReadiness: "/v1/model-gateway/readiness",
      marketResearchPosture: "/v1/market/research-posture",
    },
    schemaIds: {
      health: HEALTH_SCHEMA_ID,
      thesis: THESIS_SCHEMA_ID,
      landscape: LANDSCAPE_SCHEMA_ID,
      evidenceLedger: EVIDENCE_LEDGER_SCHEMA_ID,
      modelGateway: MODEL_GATEWAY_SCHEMA_ID,
      modelGatewayReadiness: MODEL_GATEWAY_READINESS_SCHEMA_ID,
      marketResearchPosture: MARKET_RESEARCH_SCHEMA_ID,
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

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
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
  return `${url.protocol}//${url.host}`;
}
