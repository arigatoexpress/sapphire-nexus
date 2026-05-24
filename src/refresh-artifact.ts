import { createHash } from "node:crypto";
import type { Landscape } from "./contracts.js";
import { METADATA_REFRESH_ARTIFACT_SCHEMA_ID, loadLandscape } from "./contracts.js";
import { buildDataFreshness } from "./freshness.js";
import { buildDataRefreshPlan } from "./refresh-plan.js";

export function buildMetadataRefreshArtifact(origin: string, landscape = loadLandscape(), now = new Date()) {
  const plan = buildDataRefreshPlan(origin, landscape, now);
  const freshness = buildDataFreshness(origin, landscape, now);
  const reviewItems = plan.inputs.map((input) => {
    const dataset = freshness.datasets.find((entry) => entry.id === input.id);
    const item = {
      id: input.id,
      label: input.label,
      targetPath: input.targetPath,
      targetFields: input.targetFields,
      sourceUrl: input.rights.sourceUrl,
      retrievedAt: input.rights.retrievedAt,
      retrievalMode: input.rights.retrievalMode,
      termsReview: input.rights.termsReview,
      reusePosture: input.rights.reusePosture,
      outputPolicy: input.rights.outputPolicy,
      caveats: input.rights.caveats,
      freshness: {
        route: dataset?.route ?? null,
        status: dataset?.status ?? "review",
        ageHours: dataset?.ageHours ?? null,
        freshnessTtlHours: input.rights.freshnessTtlHours,
        currentClaimsAllowed: dataset?.currentClaimsAllowed ?? false,
        manualRefreshRequiredForCurrentClaims: dataset?.manualRefreshRequiredForCurrentClaims ?? true,
        freshnessHash: dataset?.freshnessHash ?? null,
      },
      review: {
        state: "pending_source_rights_review",
        writesInThisRoute: false,
        rawPayloadsIncluded: false,
        readyForMetadataPr: false,
      },
    };

    return {
      ...item,
      artifactHash: `sha256:${sha256(canonicalJson(item))}`,
    };
  });
  const stableArtifact = {
    targetPath: plan.target.path,
    sourcePlanRoute: "/v1/data/refresh-plan",
    freshnessRoute: "/v1/data/freshness",
    verificationRoute: "/v1/verification-manifest",
    reviewItems: reviewItems.map(({ artifactHash: _artifactHash, ...item }) => item),
  };

  return {
    schemaId: METADATA_REFRESH_ARTIFACT_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: "ready_for_review",
      inputs: plan.summary.inputs,
      reviewItems: reviewItems.length,
      metadataOnly: true,
      sourceRightsReviewRequired: true,
      manualRefreshRequiredForCurrentClaims: freshness.summary.manualRefreshRequiredForCurrentClaims,
      remoteFetchesPerformed: false,
      writesPerformed: false,
      rawPayloadsIncluded: false,
    },
    artifact: {
      id: "landscape-metadata-refresh-review",
      targetPath: plan.target.path,
      targetSchemaId: plan.target.schemaId,
      sourcePlanRoute: "/v1/data/refresh-plan",
      freshnessRoute: "/v1/data/freshness",
      verificationRoute: "/v1/verification-manifest",
      reviewState: "pending_source_rights_review",
      artifactHash: `sha256:${sha256(canonicalJson(stableArtifact))}`,
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
      noRawPayloadDumps: true,
      productionClaimsRequireRevisionSmoke: true,
      readyForAutomaticWrite: false,
      blockedOutputs: ["raw API payload dumps", "paywalled or login-gated scraping", "license override claims", "current trend claims without review"],
    },
    reviewItems,
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
