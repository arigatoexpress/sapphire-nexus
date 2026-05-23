import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { isPublicDeployment, publicDeploymentReason } from "../deployment.js";

export const AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID = "sapphire.nexus.adapter.agent_runtime_publication.v1";

const execFileAsync = promisify(execFile);
const DEFAULT_AGENT_RUNTIME_ROOT = "/Users/aribs/Code/agent-runtime-control-plane";

type CommandRunner = (cwd: string) => Promise<{ stdout: string }>;

export async function checkAgentRuntimePublication(options: {
  repoRoot?: string;
  env?: NodeJS.ProcessEnv;
  commandRunner?: CommandRunner;
  now?: Date;
} = {}) {
  const env = options.env ?? process.env;
  const repoRoot = options.repoRoot ?? env.SAPPHIRE_NEXUS_AGENT_RUNTIME_ROOT ?? DEFAULT_AGENT_RUNTIME_ROOT;
  const runCommand = options.commandRunner ?? runPublicationPlan;
  if (isPublicDeployment(env)) {
    return buildDisabledReport(repoRoot, options.now);
  }

  try {
    const result = await runCommand(repoRoot);
    const plan = plainRecord(JSON.parse(result.stdout));
    const readiness = plainRecord(plan.readiness);
    const safety = plainRecord(plan.safety);
    const repository = plainRecord(plan.repository);
    const exportPolicy = plainRecord(plan.exportPolicy);
    const generatedOutputs = Array.isArray(plan.generatedOutputs) ? plan.generatedOutputs.map(plainRecord) : [];
    const violations = Array.isArray(plan.violations) ? plan.violations.map(plainRecord) : [];

    return {
      schemaId: AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID,
      generatedAt: (options.now ?? new Date()).toISOString(),
      adapter: {
        id: "agent-runtime-control-plane",
        repoRoot,
        sourceRepo: "arigatoexpress/agent-runtime-control-plane",
        mode: "read_only_publication_plan_summary",
      },
      safety: {
        readsSecrets: booleanValue(safety.readsSecretValues) ?? false,
        mutatesRuntime: booleanValue(safety.mutatesRuntime) ?? false,
        publishesRepo: booleanValue(safety.publishesRepo) ?? false,
        generatedDataContentRead: booleanValue(safety.generatedDataContentRead) ?? false,
        storesGeneratedPayloads: false,
        broadensPermissions: false,
      },
      summary: {
        status: booleanValue(readiness.publicExportBlocked) ? "blocked" : "ready",
        publicExportBlocked: booleanValue(readiness.publicExportBlocked),
        trackedSourceReady: booleanValue(readiness.trackedSourceReady),
        auditViolationCount: numberValue(readiness.auditViolationCount),
        generatedTrackedViolationCount: numberValue(readiness.generatedTrackedViolationCount),
        secretViolationCount: numberValue(readiness.secretViolationCount),
        ignoredGeneratedOutputCount: numberValue(readiness.ignoredGeneratedOutputCount),
        ignoredGeneratedOutputBytes: generatedOutputs.reduce((total, output) => total + (numberValue(output.bytes) ?? 0), 0),
      },
      repository: {
        packagePrivate: booleanValue(repository.packagePrivate),
        remote: stringValue(repository.remote),
        visibilityCheck: stringValue(repository.visibilityCheck),
      },
      exportPolicy: {
        requiresHumanApprovalBeforePublicVisibilityChange: booleanValue(exportPolicy.requiresHumanApprovalBeforePublicVisibilityChange),
        includeCount: Array.isArray(exportPolicy.include) ? exportPolicy.include.length : 0,
        excludeCount: Array.isArray(exportPolicy.exclude) ? exportPolicy.exclude.length : 0,
      },
      generatedOutputs: generatedOutputs.map((output) => ({
        path: stringValue(output.path),
        bytes: numberValue(output.bytes),
        publishAction: stringValue(output.publishAction),
      })),
      violationCount: violations.length,
    };
  } catch (error) {
    return {
      schemaId: AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID,
      generatedAt: (options.now ?? new Date()).toISOString(),
      adapter: {
        id: "agent-runtime-control-plane",
        repoRoot,
        sourceRepo: "arigatoexpress/agent-runtime-control-plane",
        mode: "read_only_publication_plan_summary",
      },
      safety: {
        readsSecrets: false,
        mutatesRuntime: false,
        publishesRepo: false,
        generatedDataContentRead: false,
        storesGeneratedPayloads: false,
        broadensPermissions: false,
      },
      summary: {
        status: "unreachable",
        publicExportBlocked: true,
        trackedSourceReady: false,
        auditViolationCount: null,
        generatedTrackedViolationCount: null,
        secretViolationCount: null,
        ignoredGeneratedOutputCount: null,
        ignoredGeneratedOutputBytes: null,
      },
      repository: {
        packagePrivate: null,
        remote: null,
        visibilityCheck: null,
      },
      exportPolicy: {
        requiresHumanApprovalBeforePublicVisibilityChange: null,
        includeCount: 0,
        excludeCount: 0,
      },
      generatedOutputs: [],
      violationCount: null,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

function buildDisabledReport(repoRoot: string, now: Date | undefined) {
  return {
    schemaId: AGENT_RUNTIME_PUBLICATION_ADAPTER_SCHEMA_ID,
    generatedAt: (now ?? new Date()).toISOString(),
    adapter: {
      id: "agent-runtime-control-plane",
      repoRoot,
      sourceRepo: "arigatoexpress/agent-runtime-control-plane",
      mode: "read_only_publication_plan_summary",
    },
    safety: {
      readsSecrets: false,
      mutatesRuntime: false,
      publishesRepo: false,
      generatedDataContentRead: false,
      storesGeneratedPayloads: false,
      broadensPermissions: false,
    },
    summary: {
      status: "disabled",
      publicExportBlocked: null,
      trackedSourceReady: null,
      auditViolationCount: null,
      generatedTrackedViolationCount: null,
      secretViolationCount: null,
      ignoredGeneratedOutputCount: null,
      ignoredGeneratedOutputBytes: null,
      reason: publicDeploymentReason(),
    },
    repository: {
      packagePrivate: null,
      remote: null,
      visibilityCheck: null,
    },
    exportPolicy: {
      requiresHumanApprovalBeforePublicVisibilityChange: true,
      includeCount: 0,
      excludeCount: 0,
    },
    generatedOutputs: [],
    violationCount: null,
  };
}

async function runPublicationPlan(cwd: string) {
  const { stdout } = await execFileAsync("node", ["scripts/publication-plan.mjs"], {
    cwd,
    encoding: "utf8",
    timeout: 5_000,
    maxBuffer: 1024 * 1024,
  });
  return { stdout };
}

function plainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}
