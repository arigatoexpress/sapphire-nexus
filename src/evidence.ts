import { createHash } from "node:crypto";
import type { Landscape } from "./contracts.js";

export const EVIDENCE_LEDGER_SCHEMA_ID = "sapphire.nexus.evidence_ledger.v1";

type EvidenceKind = "owned-repo" | "open-source-reference" | "trending-signal" | "protected-lane" | "reference-only";

export function buildEvidenceLedger(landscape: Landscape, now = new Date()) {
  const records = [
    ...landscape.ownedRepoSignals.map((repo) =>
      evidenceRecord({
        kind: "owned-repo",
        sourceId: repo.repo,
        title: repo.role,
        locator: githubLocator(repo.repo),
        rights: {
          accessPattern: "github_metadata",
          outputPolicy: "repo link, role, mine/avoid summaries, and stable hash only",
        },
        summary: {
          mine: repo.mine,
          avoid: repo.avoid,
        },
      }),
    ),
    ...landscape.openSourceShortlist.map((repo) =>
      evidenceRecord({
        kind: "open-source-reference",
        sourceId: repo.repo,
        title: repo.category,
        locator: githubLocator(repo.repo),
        rights: {
          accessPattern: "github_metadata",
          license: repo.license,
          outputPolicy: "repo link, stars, license id, fit summary, and stable hash only",
        },
        summary: {
          stars: repo.stars,
          fit: repo.fit,
        },
      }),
    ),
    ...landscape.trendingSignals.map((repo) =>
      evidenceRecord({
        kind: "trending-signal",
        sourceId: repo.repo,
        title: "GitHub trend signal",
        locator: githubLocator(repo.repo),
        rights: {
          accessPattern: "github_metadata",
          outputPolicy: "repo link, weekly star delta, fit summary, and stable hash only",
        },
        summary: {
          starsThisWeek: repo.starsThisWeek,
          fit: repo.fit,
        },
      }),
    ),
    ...landscape.protectedLanes.map((lane) =>
      evidenceRecord({
        kind: "protected-lane",
        sourceId: lane,
        title: "Protected product or infrastructure boundary",
        locator: null,
        rights: {
          accessPattern: "operator_boundary",
          outputPolicy: "boundary name and stable hash only",
        },
        summary: {
          boundary: lane,
        },
      }),
    ),
    ...(landscape.notCore ?? []).map((repo) =>
      evidenceRecord({
        kind: "reference-only",
        sourceId: repo.repo,
        title: "Reference-only component",
        locator: githubLocator(repo.repo),
        rights: {
          accessPattern: "github_metadata",
          outputPolicy: "repo link, exclusion reason, and stable hash only",
        },
        summary: {
          reason: repo.reason,
        },
      }),
    ),
  ];

  return {
    schemaId: EVIDENCE_LEDGER_SCHEMA_ID,
    generatedAt: now.toISOString(),
    safety: {
      rawPayloadsStored: false,
      readsSecrets: false,
      mutatesSources: false,
      includesPrivateMessageBodies: false,
      includesCustomerData: false,
    },
    summary: {
      records: records.length,
      byKind: countBy(records.map((record) => record.kind)),
    },
    records,
  };
}

function evidenceRecord(input: {
  kind: EvidenceKind;
  sourceId: string;
  title: string;
  locator: string | null;
  rights: Record<string, unknown>;
  summary: Record<string, unknown>;
}) {
  const stableInput = {
    kind: input.kind,
    sourceId: input.sourceId,
    title: input.title,
    locator: input.locator,
    rights: input.rights,
    summary: input.summary,
  };
  return {
    ...stableInput,
    evidenceHash: `sha256:${sha256(canonicalJson(stableInput))}`,
  };
}

function githubLocator(repo: string) {
  return repo.includes("/") ? `https://github.com/${repo}` : null;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
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

