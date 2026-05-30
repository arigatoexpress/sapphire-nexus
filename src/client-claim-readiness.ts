import type { Landscape } from "./contracts.js";
import { CLIENT_CLAIM_READINESS_SCHEMA_ID, buildBlockedClaims, buildSafetyBoundary, loadLandscape } from "./contracts.js";
import { buildDataFreshness } from "./freshness.js";

export function buildClientClaimReadiness(origin: string, landscape: Landscape = loadLandscape(), now = new Date()) {
  const freshness = buildDataFreshness(origin, landscape, now);
  const reviewRequired = freshness.summary.manualRefreshRequiredForCurrentClaims > 0 || freshness.summary.review > 0;
  const datasets = freshness.datasets.map((dataset) => {
    const currentClaimReady = dataset.currentClaimsAllowed && !dataset.manualRefreshRequiredForCurrentClaims && dataset.status !== "review";
    return {
      id: dataset.id,
      label: dataset.label,
      route: dataset.route,
      status: dataset.status,
      ageHours: dataset.ageHours,
      freshnessTtlHours: dataset.freshnessTtlHours,
      currentClaimReady,
      currentClaimsAllowedByPolicy: dataset.currentClaimsAllowed,
      manualRefreshRequiredForCurrentClaims: dataset.manualRefreshRequiredForCurrentClaims,
      caveats: dataset.rights.caveats,
      freshnessHash: dataset.freshnessHash,
    };
  });

  return {
    schemaId: CLIENT_CLAIM_READINESS_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: reviewRequired ? "review_required" : "ready",
      datasets: datasets.length,
      readyDatasets: datasets.filter((dataset) => dataset.currentClaimReady).length,
      reviewDatasets: datasets.filter((dataset) => dataset.manualRefreshRequiredForCurrentClaims).length,
      clientCurrentClaimsAllowed: !reviewRequired,
      liveActionsEnabled: false,
    },
    gates: [
      {
        id: "verify-revision",
        route: "/v1/deployment",
        required: true,
        state: "required_before_production_claim",
        reason: "Production claims must name the live revision currently serving traffic.",
      },
      {
        id: "review-freshness",
        route: "/v1/data/freshness",
        required: true,
        state: reviewRequired ? "review_required" : "satisfied",
        reason: "Checked-in metadata must be inside TTL or manually reviewed before current client claims.",
      },
      {
        id: "review-refresh-artifact",
        route: "/v1/data/refresh-artifact",
        required: reviewRequired,
        state: reviewRequired ? "review_required" : "optional",
        reason: "The refresh artifact packages source-rights evidence before metadata updates.",
      },
      {
        id: "verify-public-surface",
        route: "/v1/verification-manifest",
        required: true,
        state: "required_before_production_claim",
        reason: "Public checks and hardening headers should pass before client-facing claims.",
      },
    ],
    datasets,
    safety: {
      ...buildSafetyBoundary(),
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesRuntime: false,
      writesDataInThisRoute: false,
      storesRawPayloads: false,
      sendsExternalMessages: false,
      liveActionsEnabled: false,
    },
    policy: {
      publicSafe: true,
      checkedInMetadataOnly: true,
      sourceRightsReviewRequiredForCurrentClaims: true,
      revisionVerificationRequiredBeforeProductionClaims: true,
      rawPayloadsAllowed: false,
      blockedClaims: buildBlockedClaims(),
    },
  };
}
