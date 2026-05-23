import { createHash } from "node:crypto";
import type { Landscape } from "./contracts.js";
import { DATA_FRESHNESS_SCHEMA_ID, loadLandscape } from "./contracts.js";

const MS_PER_HOUR = 60 * 60 * 1000;

type FreshnessStatus = "current" | "snapshot" | "review";

type FreshnessInput = {
  id: string;
  label: string;
  route: string;
  source: string;
  generatedAt: string;
  freshnessTtlHours: number;
  currentClaimsAllowed: boolean;
  snapshotOnly?: boolean;
  manualRefreshRequiredForCurrentClaims?: boolean;
  outputPolicy: string;
  caveats: string[];
};

export function buildDataFreshness(origin: string, landscape = loadLandscape(), now = new Date()) {
  const datasets = [
    freshnessRecord(
      {
        id: "landscape",
        label: "Landscape catalog",
        route: "/v1/landscape",
        source: "data/landscape.json",
        generatedAt: landscape.generatedAt,
        freshnessTtlHours: 168,
        currentClaimsAllowed: true,
        outputPolicy: "checked-in landscape metadata only",
        caveats: ["Refresh before claiming the landscape reflects every current repo, library, or integration option."],
      },
      now,
    ),
    freshnessRecord(
      {
        id: "evidenceLedger",
        label: "Evidence ledger",
        route: "/v1/evidence-ledger",
        source: "data/landscape.json derived records",
        generatedAt: landscape.generatedAt,
        freshnessTtlHours: 168,
        currentClaimsAllowed: true,
        outputPolicy: "links, source ids, rights metadata, summaries, and stable hashes only",
        caveats: ["The ledger is derived from checked-in metadata and is not a live crawl of upstream sources."],
      },
      now,
    ),
    freshnessRecord(
      {
        id: "repoMining",
        label: "Repo-mining adapter",
        route: "/v1/adapters/repo-mining/readiness",
        source: "data/landscape.json ownedRepoSignals",
        generatedAt: landscape.generatedAt,
        freshnessTtlHours: 168,
        currentClaimsAllowed: true,
        outputPolicy: "repo links, mining intent, avoidance guidance, rights envelopes, and stable hashes only",
        caveats: ["Code reuse still requires per-repo review before copying, vendoring, or collapsing source into Nexus."],
      },
      now,
    ),
    freshnessRecord(
      {
        id: "publicSources",
        label: "Public-source adapter",
        route: "/v1/adapters/public-sources/readiness",
        source: "data/landscape.json openSourceShortlist",
        generatedAt: landscape.generatedAt,
        freshnessTtlHours: 168,
        currentClaimsAllowed: true,
        outputPolicy: "repo link, license id, star count, category, fit summary, rights posture, and stable hash only",
        caveats: ["Public availability is not permission; license posture must be reviewed before reuse."],
      },
      now,
    ),
    freshnessRecord(
      {
        id: "trendingSignals",
        label: "Trending-signals adapter",
        route: "/v1/adapters/trending-signals/readiness",
        source: "data/landscape.json trendingSignals",
        generatedAt: landscape.generatedAt,
        freshnessTtlHours: 24,
        currentClaimsAllowed: false,
        snapshotOnly: true,
        manualRefreshRequiredForCurrentClaims: true,
        outputPolicy: "snapshot trend metadata only; no current-trending claims without manual refresh",
        caveats: [
          "The trend values are checked-in snapshots, not a live GitHub trending read.",
          "Refresh metadata before making current popularity or ranking claims.",
        ],
      },
      now,
    ),
  ];

  return {
    schemaId: DATA_FRESHNESS_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: "ready",
      datasets: datasets.length,
      current: datasets.filter((dataset) => dataset.status === "current").length,
      snapshot: datasets.filter((dataset) => dataset.status === "snapshot").length,
      review: datasets.filter((dataset) => dataset.status === "review").length,
      currentClaimsAllowed: datasets.filter((dataset) => dataset.currentClaimsAllowed).length,
      manualRefreshRequiredForCurrentClaims: datasets.filter((dataset) => dataset.manualRefreshRequiredForCurrentClaims).length,
      fetchesRemoteSources: false,
    },
    safety: {
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesSources: false,
      vendorsCode: false,
      storesRawPayloads: false,
      liveActionsEnabled: false,
    },
    policy: {
      checkedInMetadataOnly: true,
      clientClaimsRequireFreshnessReview: true,
      currentTrendClaimsRequireManualRefresh: true,
      allowedOutputs: ["source id", "route", "retrieval timestamp", "freshness ttl", "output policy", "caveat", "stable hash"],
      blockedOutputs: ["raw source payload dumps", "current trend claims without refresh", "vendored source code", "license override claims"],
    },
    datasets,
  };
}

function freshnessRecord(input: FreshnessInput, now: Date) {
  const ageHours = freshnessAgeHours(input.generatedAt, now);
  const withinTtl = ageHours !== null && ageHours <= input.freshnessTtlHours;
  const status: FreshnessStatus = input.snapshotOnly ? (withinTtl ? "snapshot" : "review") : withinTtl ? "current" : "review";
  const manualRefreshRequiredForCurrentClaims =
    input.manualRefreshRequiredForCurrentClaims ?? (status === "review" || input.currentClaimsAllowed === false);
  const rights = {
    owner: "Sapphire Nexus",
    accessPattern: "checked_in_repository_metadata",
    retrievalMode: "checked_in_landscape_metadata",
    retrievedAt: input.generatedAt,
    freshnessTtlHours: input.freshnessTtlHours,
    reusePosture: input.snapshotOnly ? "metadata_snapshot_only" : "derived_metadata_only",
    outputPolicy: input.outputPolicy,
    caveats: input.caveats,
  };
  const stableInput = {
    id: input.id,
    sourceId: input.id,
    label: input.label,
    route: input.route,
    source: input.source,
    generatedAt: input.generatedAt,
    freshnessTtlHours: input.freshnessTtlHours,
    status,
    currentClaimsAllowed: input.currentClaimsAllowed,
    manualRefreshRequiredForCurrentClaims,
    rights,
  };

  return {
    ...stableInput,
    ageHours,
    sourceUrl: input.route,
    freshnessHash: `sha256:${sha256(canonicalJson(stableInput))}`,
  };
}

function freshnessAgeHours(generatedAt: string, now: Date) {
  const generated = new Date(generatedAt);
  if (!Number.isFinite(generated.getTime())) return null;
  const age = (now.getTime() - generated.getTime()) / MS_PER_HOUR;
  return Math.max(0, Math.round(age * 10) / 10);
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
