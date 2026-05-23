import { createHash } from "node:crypto";
import type { Landscape } from "../contracts.js";
import { loadLandscape } from "../contracts.js";

export const TRENDING_SIGNALS_ADAPTER_SCHEMA_ID = "sapphire.nexus.adapter.trending_signals.v1";

export function buildTrendingSignalsReadiness(landscape = loadLandscape(), now = new Date()) {
  const signals = landscape.trendingSignals.map((signal) => trendingSignalRecord(signal, landscape.generatedAt));
  const totalStarsThisWeek = signals.reduce((total, signal) => total + signal.starsThisWeek, 0);

  return {
    schemaId: TRENDING_SIGNALS_ADAPTER_SCHEMA_ID,
    generatedAt: now.toISOString(),
    adapter: {
      id: "trending-signals",
      source: "data/landscape.json trendingSignals",
      mode: "checked_in_metadata_only",
    },
    summary: {
      status: signals.length > 0 ? "ready" : "degraded",
      signals: signals.length,
      totalStarsThisWeek,
      snapshotAt: landscape.generatedAt,
      currentTrendClaimsAllowed: false,
      manualRefreshRequiredForCurrentClaims: true,
    },
    safety: {
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesSources: false,
      vendorsCode: false,
      rawPayloadsStored: false,
      liveActionsEnabled: false,
    },
    policy: {
      allowedOutputs: ["repo link", "checked-in stars-this-week snapshot", "fit summary", "freshness caveat", "stable hash"],
      blockedOutputs: ["raw fetched payload dumps", "current-trending claims without refresh", "vendored source code", "license override claims"],
      snapshotOnly: true,
      refreshRequiredBeforeClientTrendClaims: true,
    },
    signals,
  };
}

function trendingSignalRecord(signal: Landscape["trendingSignals"][number], retrievedAt: string) {
  const [owner = "unknown"] = signal.repo.split("/");
  const rights = {
    owner,
    accessPattern: "public_github_trending_metadata",
    retrievalMode: "checked_in_landscape_metadata",
    retrievedAt,
    freshnessTtl: "manual_refresh_required_before_current_claims",
    reusePosture: "metadata_snapshot_only",
    outputPolicy: "repo link, checked-in stars-this-week snapshot, fit summary, caveat, and stable hash only",
    caveats: [
      "This is a checked-in snapshot, not a live GitHub trending read.",
      "Refresh metadata before making current popularity or ranking claims.",
      "No source files are copied, vendored, or collapsed into Nexus.",
    ],
  };
  const stableInput = {
    sourceId: signal.repo,
    locator: `https://github.com/${signal.repo}`,
    starsThisWeek: signal.starsThisWeek,
    fit: signal.fit,
    rights,
  };

  return {
    ...stableInput,
    rights,
    sourceHash: `sha256:${sha256(canonicalJson(stableInput))}`,
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
