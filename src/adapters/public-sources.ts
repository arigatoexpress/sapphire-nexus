import { createHash } from "node:crypto";
import type { Landscape } from "../contracts.js";
import { loadLandscape } from "../contracts.js";

export const PUBLIC_SOURCES_ADAPTER_SCHEMA_ID = "sapphire.nexus.adapter.public_sources.v1";

const PERMISSIVE_LICENSES = new Set(["MIT", "Apache-2.0", "BSD-3-Clause"]);
const REFERENCE_ONLY_LICENSES = new Set(["AGPL-3.0", "GPL-3.0"]);

export function buildPublicSourcesReadiness(landscape = loadLandscape(), now = new Date()) {
  const sources = landscape.openSourceShortlist.map((source) => publicSourceRecord(source));
  const permissive = sources.filter((source) => source.rights.reusePosture === "permissive-reference").length;
  const referenceOnly = sources.filter((source) => source.rights.reusePosture === "reference-only").length;
  const needsReview = sources.filter((source) => source.rights.reusePosture === "needs-review").length;

  return {
    schemaId: PUBLIC_SOURCES_ADAPTER_SCHEMA_ID,
    generatedAt: now.toISOString(),
    adapter: {
      id: "public-sources",
      source: "data/landscape.json openSourceShortlist",
      mode: "derived_metadata_only",
    },
    summary: {
      status: needsReview === 0 ? "ready" : "degraded",
      publicSources: sources.length,
      permissive,
      referenceOnly,
      needsReview,
    },
    safety: {
      readsSecrets: false,
      fetchesRemoteSources: false,
      mutatesSources: false,
      vendorsCode: false,
      rawPayloadsStored: false,
      liveTradingAllowed: false,
      paymentSettlementAllowed: false,
    },
    policy: {
      allowedOutputs: ["repo link", "license id", "star count", "category", "fit summary", "rights posture", "stable hash"],
      blockedOutputs: ["raw fetched payload dumps", "vendored source code", "license override claims", "live execution recommendations"],
      vendoringRequiresReview: true,
      copyleftSourcesReferenceOnly: true,
    },
    sources,
  };
}

function publicSourceRecord(source: Landscape["openSourceShortlist"][number]) {
  const rights = {
    accessPattern: "public_github_metadata",
    license: source.license,
    reusePosture: reusePosture(source.license),
    outputPolicy: "repo link, metadata summary, rights posture, and stable hash only",
  };
  const stableInput = {
    sourceId: source.repo,
    locator: `https://github.com/${source.repo}`,
    category: source.category,
    license: source.license,
    stars: source.stars,
    fit: source.fit,
    rights,
  };

  return {
    ...stableInput,
    rights,
    sourceHash: `sha256:${sha256(canonicalJson(stableInput))}`,
  };
}

function reusePosture(license: string) {
  if (PERMISSIVE_LICENSES.has(license)) return "permissive-reference";
  if (REFERENCE_ONLY_LICENSES.has(license)) return "reference-only";
  return "needs-review";
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
