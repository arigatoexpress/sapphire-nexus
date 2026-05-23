import { createHash } from "node:crypto";
import type { Landscape } from "../contracts.js";
import { loadLandscape } from "../contracts.js";

export const REPO_MINING_ADAPTER_SCHEMA_ID = "sapphire.nexus.adapter.repo_mining.v1";

export function buildRepoMiningReadiness(landscape = loadLandscape(), now = new Date()) {
  const repos = landscape.ownedRepoSignals.map((repo) => repoMiningRecord(repo, landscape.generatedAt));
  const mineSignals = repos.reduce((total, repo) => total + repo.mine.length, 0);
  const avoidSignals = repos.reduce((total, repo) => total + repo.avoid.length, 0);

  return {
    schemaId: REPO_MINING_ADAPTER_SCHEMA_ID,
    generatedAt: now.toISOString(),
    adapter: {
      id: "repo-mining",
      source: "data/landscape.json ownedRepoSignals",
      mode: "checked_in_metadata_only",
    },
    summary: {
      status: "ready",
      repos: repos.length,
      mineSignals,
      avoidSignals,
      protectedLanesPreserved: landscape.protectedLanes.length,
    },
    safety: {
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesSourceRepos: false,
      deletesSourceRepos: false,
      vendorsCode: false,
      rawPayloadsStored: false,
      permissionBroadening: false,
      liveActionsEnabled: false,
    },
    policy: {
      allowedOutputs: ["repo link", "mining intent", "avoidance guidance", "rights envelope", "stable hash"],
      blockedOutputs: ["raw source dumps", "vendored source code", "protected-lane absorption", "repo deletion", "permission changes"],
      protectedProductsStaySeparate: true,
      perRepoReviewRequiredBeforeCodeReuse: true,
    },
    repos,
  };
}

function repoMiningRecord(repo: Landscape["ownedRepoSignals"][number], retrievedAt: string) {
  const [owner = "unknown"] = repo.repo.split("/");
  const rights = {
    owner,
    accessPattern: "ari_owned_github_metadata",
    retrievalMode: "checked_in_landscape_metadata",
    retrievedAt,
    freshnessTtl: "manual_refresh_required",
    reusePosture: "contract_metadata_only",
    outputPolicy: "repo link, mining intent, avoidance guidance, caveats, and stable hash only",
    caveats: [
      "No source files are copied, vendored, or collapsed into Nexus.",
      "Implementation reuse requires per-repo review before code movement.",
      "Purpose-built products and protected lanes remain separate.",
    ],
  };
  const stableInput = {
    sourceId: repo.repo,
    locator: `https://github.com/${repo.repo}`,
    role: repo.role,
    mine: repo.mine,
    avoid: repo.avoid,
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
