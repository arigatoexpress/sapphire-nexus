import { createHash } from "node:crypto";
import type { Landscape } from "./contracts.js";
import { DATA_REFRESH_PLAN_SCHEMA_ID, loadLandscape } from "./contracts.js";
import { buildDataFreshness } from "./freshness.js";

type RefreshInput = {
  id: string;
  label: string;
  sourceOwner: string;
  sourceUrl: string;
  retrievedAt: string;
  targetPath: string;
  targetFields: string[];
  retrievalMode: string;
  freshnessTtlHours: number;
  outputPolicy: string;
  caveats: string[];
};

export function buildDataRefreshPlan(origin: string, landscape = loadLandscape(), now = new Date()) {
  const freshness = buildDataFreshness(origin, landscape, now);
  const inputs = refreshInputs(landscape);
  const workflow = [
    {
      id: "verify-current-production",
      lane: "agent-safe",
      action: "Run revision-aware production smoke before changing checked-in metadata.",
      proof: "SAPPHIRE_NEXUS_EXPECTED_REVISION=<revision> node scripts/production-smoke.mjs <public-url>",
      writesData: false,
    },
    {
      id: "collect-derived-metadata",
      lane: "agent-safe",
      action: "Use official public pages or APIs only to collect derived metadata into a review artifact.",
      proof: "Artifact lists source urls, retrievedAt timestamps, terms/license notes, and changed metadata fields.",
      writesData: false,
    },
    {
      id: "review-rights-envelope",
      lane: "ari-review",
      action: "Review license, terms, reuse posture, and caveats before treating refreshed metadata as client-current.",
      proof: "Ari-approved source-rights note or checked-in PR description.",
      writesData: false,
    },
    {
      id: "update-landscape-metadata",
      lane: "agent-safe-after-review",
      action: "Update only checked-in metadata fields in data/landscape.json and keep raw payloads out of the repository.",
      proof: "Focused PR diff plus npm run verify and production smoke after deploy.",
      writesData: true,
    },
  ];

  return {
    schemaId: DATA_REFRESH_PLAN_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: "ready",
      inputs: inputs.length,
      workflowSteps: workflow.length,
      freshnessReviewCount: freshness.summary.review,
      manualRefreshRequiredForCurrentClaims: freshness.summary.manualRefreshRequiredForCurrentClaims,
      remoteFetchesPerformed: false,
      writesPerformed: false,
      rawPayloadsAllowed: false,
    },
    target: {
      path: "data/landscape.json",
      schemaId: landscape.schemaId,
      currentGeneratedAt: landscape.generatedAt,
      updateMode: "reviewed_metadata_pr_only",
    },
    safety: {
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesSources: false,
      writesDataInThisRoute: false,
      storesRawPayloads: false,
      vendorsCode: false,
      liveActionsEnabled: false,
    },
    policy: {
      officialSourcesOnly: true,
      checkedInMetadataOnly: true,
      sourceRightsReviewRequired: true,
      currentTrendClaimsRequireManualRefresh: true,
      productionClaimsRequireRevisionSmoke: true,
      allowedOutputs: ["source url", "retrieval timestamp", "license or terms note", "metadata diff", "stable hash", "freshness caveat"],
      blockedOutputs: ["raw API payload dumps", "paywalled or login-gated scraping", "current trend claims without review", "vendored source code"],
    },
    workflow,
    inputs,
  };
}

function refreshInputs(landscape: Landscape) {
  return [
    refreshRecord({
      id: "landscape",
      label: "Landscape catalog",
      sourceOwner: "Sapphire Nexus",
      sourceUrl: "https://github.com/arigatoexpress/sapphire-nexus/blob/main/data/landscape.json",
      retrievedAt: landscape.generatedAt,
      targetPath: "data/landscape.json",
      targetFields: ["generatedAt", "principles", "protectedLanes", "notCore"],
      retrievalMode: "checked-in repository review",
      freshnessTtlHours: 168,
      outputPolicy: "metadata diff, caveat, and stable hash only",
      caveats: ["Do not infer live repo state without a fresh repository or GitHub readback."],
    }),
    refreshRecord({
      id: "repoMining",
      label: "Repo-mining metadata",
      sourceOwner: "Ari / arigatoexpress",
      sourceUrl: "https://github.com/arigatoexpress?tab=repositories",
      retrievedAt: landscape.generatedAt,
      targetPath: "data/landscape.json ownedRepoSignals",
      targetFields: ["repo", "role", "mine", "avoid"],
      retrievalMode: "manual repo review or official GitHub metadata",
      freshnessTtlHours: 168,
      outputPolicy: "repo link, intent summary, avoidance guidance, caveat, and stable hash only",
      caveats: ["Do not copy source files or collapse protected products into Nexus."],
    }),
    refreshRecord({
      id: "publicSources",
      label: "Public-source shortlist metadata",
      sourceOwner: "upstream repository owners",
      sourceUrl: "https://github.com",
      retrievedAt: landscape.generatedAt,
      targetPath: "data/landscape.json openSourceShortlist",
      targetFields: ["repo", "category", "stars", "license", "fit"],
      retrievalMode: "official public metadata only",
      freshnessTtlHours: 168,
      outputPolicy: "repo link, license id, star count, fit summary, caveat, and stable hash only",
      caveats: ["Public availability is not permission; review license and terms before reuse."],
    }),
    refreshRecord({
      id: "trendingSignals",
      label: "Trending-signal snapshot metadata",
      sourceOwner: "GitHub and upstream repository owners",
      sourceUrl: "https://github.com/trending",
      retrievedAt: landscape.generatedAt,
      targetPath: "data/landscape.json trendingSignals",
      targetFields: ["repo", "starsThisWeek", "fit"],
      retrievalMode: "manual snapshot refresh from official public metadata",
      freshnessTtlHours: 24,
      outputPolicy: "snapshot repo link, stars-this-week value, fit summary, caveat, and stable hash only",
      caveats: ["Client-current trend claims require a same-day refresh and source-rights review."],
    }),
  ];
}

function refreshRecord(input: RefreshInput) {
  const rights = {
    sourceOwner: input.sourceOwner,
    sourceUrl: input.sourceUrl,
    retrievalMode: input.retrievalMode,
    retrievedAt: input.retrievedAt,
    freshnessTtlHours: input.freshnessTtlHours,
    termsReview: "required_before_reuse",
    reusePosture: "derived_metadata_only",
    outputPolicy: input.outputPolicy,
    caveats: input.caveats,
  };
  const stableInput = {
    id: input.id,
    label: input.label,
    targetPath: input.targetPath,
    targetFields: input.targetFields,
    rights,
  };

  return {
    ...stableInput,
    refreshHash: `sha256:${sha256(canonicalJson(stableInput))}`,
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
