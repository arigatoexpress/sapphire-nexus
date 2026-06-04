import { createHash } from "node:crypto";
import type { Landscape } from "./contracts.js";
import { DATA_REVIEW_QUEUE_SCHEMA_ID, buildSafetyBoundary, loadLandscape } from "./contracts.js";
import { buildMetadataRefreshArtifact } from "./refresh-artifact.js";

export function buildDataReviewQueue(origin: string, landscape: Landscape = loadLandscape(), now = new Date()) {
  const refreshArtifact = buildMetadataRefreshArtifact(origin, landscape, now);
  const items = refreshArtifact.reviewItems.map((item) => {
    const claimBlocking = item.freshness.manualRefreshRequiredForCurrentClaims;
    const queueItem = {
      id: item.id,
      label: item.label,
      route: item.freshness.route,
      sourceUrl: item.sourceUrl,
      targetPath: item.targetPath,
      targetFields: item.targetFields,
      priority: claimBlocking ? "claim_blocking" : "standard_review",
      lane: "ari-review",
      state: item.review.state,
      claimBlocking,
      ageHours: item.freshness.ageHours,
      freshnessTtlHours: item.freshness.freshnessTtlHours,
      requiredBefore: ["client-current claims", "metadata PR approval"],
      agentSafePreparation: ["run revision-aware smoke", "prepare metadata-only diff", "include source URL and stable hashes"],
      ariDecisionRequired: true,
      rawPayloadsAllowed: false,
      writesAllowedInThisRoute: false,
      artifactHash: item.artifactHash,
    };

    return {
      ...queueItem,
      queueHash: `sha256:${sha256(canonicalJson(queueItem))}`,
    };
  });
  const claimBlockingItems = items.filter((item) => item.claimBlocking).length;
  const queueHashInput = {
    sourceArtifactHash: refreshArtifact.artifact.artifactHash,
    items: items.map(({ queueHash: _queueHash, ...item }) => item),
  };

  return {
    schemaId: DATA_REVIEW_QUEUE_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: claimBlockingItems > 0 ? "review_required" : "ready_for_review",
      items: items.length,
      claimBlockingItems,
      ariReviewRequired: items.filter((item) => item.ariDecisionRequired).length,
      agentSafePreparationItems: items.length,
      liveActionsEnabled: false,
      remoteFetchesPerformed: false,
      writesPerformed: false,
      readyForAutomaticWrite: false,
    },
    source: {
      artifactRoute: "/v1/data/refresh-artifact",
      freshnessRoute: "/v1/data/freshness",
      claimReadinessRoute: "/v1/client/claim-readiness",
      artifactHash: refreshArtifact.artifact.artifactHash,
    },
    queue: {
      reviewState: "pending_source_rights_review",
      queueHash: `sha256:${sha256(canonicalJson(queueHashInput))}`,
    },
    items,
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
      sourceRightsReviewRequired: true,
      ariDecisionRequiredBeforeClientCurrentClaims: claimBlockingItems > 0,
      rawPayloadsAllowed: false,
      automaticWritesAllowed: false,
      allowedOutputs: ["source URL", "target fields", "review state", "freshness age", "stable hash", "operator lane"],
      blockedOutputs: ["raw source payload dumps", "automatic metadata writes", "current client claims before review"],
    },
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
