import { checkAgentRuntimePublication } from "./adapters/agent-runtime.js";
import { checkAoeReadiness } from "./adapters/aoe.js";
import { buildPublicSourcesReadiness } from "./adapters/public-sources.js";
import { buildRepoMiningReadiness } from "./adapters/repo-mining.js";
import { buildTrendingSignalsReadiness } from "./adapters/trending-signals.js";
import {
  NEXUS_READINESS_SCHEMA_ID,
  buildHealth,
  buildLandscapeEvidenceLedger,
  checkModelGatewayReadiness,
  checkModelPromptSmoke,
} from "./contracts.js";

type ProbeId =
  | "health"
  | "evidenceLedger"
  | "repoMining"
  | "trendingSignals"
  | "publicSources"
  | "modelGateway"
  | "modelPromptSmoke"
  | "aoe"
  | "agentRuntime";
type ProbeStatus = "ready" | "degraded" | "unreachable" | "blocked" | "disabled";
type ProbeRunner = () => Promise<unknown> | unknown;

const PROBE_ORDER: ProbeId[] = [
  "health",
  "evidenceLedger",
  "repoMining",
  "trendingSignals",
  "publicSources",
  "modelGateway",
  "modelPromptSmoke",
  "aoe",
  "agentRuntime",
];

export async function checkNexusReadiness(options: {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  probes?: Partial<Record<ProbeId, ProbeRunner>>;
} = {}) {
  const env = options.env ?? process.env;
  const now = options.now ?? new Date();
  const probes: Record<ProbeId, ProbeRunner> = {
    health: () => buildHealth(now),
    evidenceLedger: () => buildLandscapeEvidenceLedger(),
    repoMining: () => buildRepoMiningReadiness(undefined, now),
    trendingSignals: () => buildTrendingSignalsReadiness(undefined, now),
    publicSources: () => buildPublicSourcesReadiness(undefined, now),
    modelGateway: () => checkModelGatewayReadiness({ env, now }),
    modelPromptSmoke: () => checkModelPromptSmoke({ env, now }),
    aoe: () => checkAoeReadiness({ env, now }),
    agentRuntime: () => checkAgentRuntimePublication({ env, now }),
    ...options.probes,
  };

  const checks = await Promise.all(PROBE_ORDER.map((id) => runProbe(id, probes[id])));
  const degraded = checks.filter((check) => ["blocked", "degraded", "unreachable"].includes(check.status)).length;
  const disabled = checks.filter((check) => check.status === "disabled").length;
  const ready = checks.filter((check) => check.status === "ready").length;

  return {
    schemaId: NEXUS_READINESS_SCHEMA_ID,
    generatedAt: now.toISOString(),
    status: degraded === 0 ? "ready" : "degraded",
    summary: {
      checks: checks.length,
      ready,
      degraded,
      disabled,
      productionUsable: degraded === 0,
    },
    safety: {
      liveActionsEnabled: false,
      readsSecrets: false,
      sendsUserPrompts: false,
      storesRawPayloads: false,
      mutatesRuntime: false,
      startsTraining: false,
      cloudFallbackAllowed: false,
    },
    checks,
  };
}

async function runProbe(id: ProbeId, probe: ProbeRunner) {
  const started = Date.now();
  try {
    const payload = await probe();
    return {
      id,
      label: labelForProbe(id),
      durationMs: Date.now() - started,
      ...summarizeProbe(id, payload),
    };
  } catch (error) {
    return {
      id,
      label: labelForProbe(id),
      status: "unreachable" as const,
      ready: false,
      durationMs: Date.now() - started,
      detail: {
        error: error instanceof Error ? error.name : "unknown_error",
      },
    };
  }
}

function summarizeProbe(id: ProbeId, payload: unknown): {
  status: ProbeStatus;
  ready: boolean;
  detail: Record<string, unknown>;
} {
  const record = plainRecord(payload);
  const summary = plainRecord(record.summary);
  switch (id) {
    case "health": {
      const ready = record.status === "ok" && record.liveActionsEnabled === false;
      return {
        status: ready ? "ready" : "degraded",
        ready,
        detail: {
          status: stringValue(record.status),
          liveActionsEnabled: booleanValue(record.liveActionsEnabled),
        },
      };
    }
    case "evidenceLedger": {
      const records = numberValue(summary.records) ?? 0;
      const rawPayloadsStored = booleanValue(plainRecord(record.safety).rawPayloadsStored);
      const ready = records > 0 && rawPayloadsStored === false;
      return {
        status: ready ? "ready" : "degraded",
        ready,
        detail: {
          records,
          rawPayloadsStored,
        },
      };
    }
    case "publicSources": {
      const status = statusValue(summary.status);
      const rawPayloadsStored = booleanValue(plainRecord(record.safety).rawPayloadsStored);
      const ready = status === "ready" && rawPayloadsStored === false;
      return {
        status: ready ? "ready" : "degraded",
        ready,
        detail: {
          publicSources: numberValue(summary.publicSources),
          permissive: numberValue(summary.permissive),
          referenceOnly: numberValue(summary.referenceOnly),
          needsReview: numberValue(summary.needsReview),
          rawPayloadsStored,
        },
      };
    }
    case "repoMining": {
      const status = statusValue(summary.status);
      const safety = plainRecord(record.safety);
      const ready =
        status === "ready" &&
        booleanValue(safety.fetchesRemoteSources) === false &&
        booleanValue(safety.vendorsCode) === false &&
        booleanValue(safety.deletesSourceRepos) === false;
      return {
        status: ready ? "ready" : "degraded",
        ready,
        detail: {
          repos: numberValue(summary.repos),
          mineSignals: numberValue(summary.mineSignals),
          avoidSignals: numberValue(summary.avoidSignals),
          protectedLanesPreserved: numberValue(summary.protectedLanesPreserved),
          fetchesRemoteSources: booleanValue(safety.fetchesRemoteSources),
          vendorsCode: booleanValue(safety.vendorsCode),
        },
      };
    }
    case "trendingSignals": {
      const status = statusValue(summary.status);
      const safety = plainRecord(record.safety);
      const ready =
        status === "ready" &&
        booleanValue(safety.fetchesRemoteSources) === false &&
        booleanValue(safety.vendorsCode) === false &&
        booleanValue(summary.currentTrendClaimsAllowed) === false;
      return {
        status: ready ? "ready" : "degraded",
        ready,
        detail: {
          signals: numberValue(summary.signals),
          totalStarsThisWeek: numberValue(summary.totalStarsThisWeek),
          snapshotAt: stringValue(summary.snapshotAt),
          currentTrendClaimsAllowed: booleanValue(summary.currentTrendClaimsAllowed),
          manualRefreshRequiredForCurrentClaims: booleanValue(summary.manualRefreshRequiredForCurrentClaims),
          fetchesRemoteSources: booleanValue(safety.fetchesRemoteSources),
        },
      };
    }
    case "modelGateway": {
      const degraded = numberValue(summary.degraded) ?? 0;
      const disabled = numberValue(summary.disabled) ?? 0;
      const gateways = numberValue(summary.gateways) ?? 0;
      const readyCount = numberValue(summary.ready) ?? 0;
      const status = disabled > 0 && disabled === gateways ? "disabled" : degraded === 0 ? "ready" : readyCount > 0 ? "degraded" : "unreachable";
      return {
        status,
        ready: status === "ready",
        detail: {
          gateways,
          ready: readyCount,
          degraded,
          disabled,
          reason: stringValue(summary.reason),
        },
      };
    }
    case "modelPromptSmoke": {
      const status = statusValue(summary.status);
      return {
        status,
        ready: booleanValue(summary.ready) === true,
        detail: {
          status,
          reason: stringValue(summary.reason),
          sendsUserPrompts: booleanValue(plainRecord(record.safety).sendsUserPrompts),
          storesPrompts: booleanValue(plainRecord(record.safety).storesPrompts),
          storesCompletions: booleanValue(plainRecord(record.safety).storesCompletions),
        },
      };
    }
    case "aoe": {
      const status = statusValue(summary.status);
      return {
        status,
        ready: status === "ready",
        detail: {
          endpoints: numberValue(summary.endpoints),
          ready: numberValue(summary.ready),
          degraded: numberValue(summary.degraded),
          disabled: numberValue(summary.disabled),
          reason: stringValue(summary.reason),
          operatorHint: plainRecord(summary.operatorHint),
        },
      };
    }
    case "agentRuntime": {
      const status = statusValue(summary.status);
      return {
        status,
        ready: status === "ready",
        detail: {
          publicExportBlocked: booleanValue(summary.publicExportBlocked),
          trackedSourceReady: booleanValue(summary.trackedSourceReady),
          secretViolationCount: numberValue(summary.secretViolationCount),
          ignoredGeneratedOutputCount: numberValue(summary.ignoredGeneratedOutputCount),
          reason: stringValue(summary.reason),
        },
      };
    }
  }
}

function labelForProbe(id: ProbeId) {
  return {
    health: "Core health",
    evidenceLedger: "Evidence ledger",
    repoMining: "Repo-mining adapter",
    trendingSignals: "Trending-signals adapter",
    publicSources: "Public-source rights adapter",
    modelGateway: "Model gateway readiness",
    modelPromptSmoke: "Local prompt smoke",
    aoe: "AOE adapter",
    agentRuntime: "Agent-runtime publication adapter",
  }[id];
}

function statusValue(value: unknown): ProbeStatus {
  return value === "ready" || value === "degraded" || value === "unreachable" || value === "blocked" || value === "disabled"
    ? value
    : "degraded";
}

function plainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}
