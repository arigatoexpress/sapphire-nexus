export const DEPLOYMENT_IDENTITY_SCHEMA_ID = "sapphire.nexus.deployment_identity.v1";

export function isPublicDeployment(env = process.env) {
  return parseBoolean(env.SAPPHIRE_NEXUS_PUBLIC_MODE) === true || parseBoolean(env.VERCEL) === true;
}

export function publicDeploymentReason() {
  return "public deployment disables private local adapter probes";
}

export function buildDeploymentIdentity(origin: string, env = process.env, now = new Date()) {
  const publicDeployment = isPublicDeployment(env);
  return {
    schemaId: DEPLOYMENT_IDENTITY_SCHEMA_ID,
    service: "sapphire-nexus",
    origin,
    generatedAt: now.toISOString(),
    runtime: {
      provider: runtimeProvider(env),
      service: safeRuntimeValue(env.K_SERVICE),
      revision: safeRuntimeValue(env.K_REVISION),
      configuration: safeRuntimeValue(env.K_CONFIGURATION),
      vercel: parseBoolean(env.VERCEL) === true,
    },
    mode: {
      publicDeployment,
      reason: publicDeployment ? publicDeploymentReason() : "local or private development mode",
      liveActionsEnabled: false,
    },
    safety: {
      readsSecrets: false,
      exposesEnvironmentDump: false,
      mutatesInfrastructure: false,
      broadensPermissions: false,
      liveTradingAllowed: false,
      paymentSettlementAllowed: false,
      walletSigningAllowed: false,
      telegramSendsAllowed: false,
      customerSendsAllowed: false,
    },
    operator: {
      verifyBeforeClaimingProduction: true,
      expectedProductionChecks: [
        "Cloud Run latestReadyRevisionName matches runtime.revision",
        "production smoke passes against the public URL",
        "response headers report headersOk=true",
      ],
    },
  };
}

function runtimeProvider(env: NodeJS.ProcessEnv) {
  if (env.K_SERVICE) return "cloud-run";
  if (parseBoolean(env.VERCEL) === true) return "vercel";
  return "local";
}

function safeRuntimeValue(value: string | undefined) {
  if (!value) return null;
  if (value.length > 120) return "redacted-invalid-format";
  return /^[A-Za-z0-9._:-]+$/.test(value) ? value : "redacted-invalid-format";
}

function parseBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }
  return ["1", "true", "yes"].includes(value.toLowerCase());
}
