export function isPublicDeployment(env = process.env) {
  return parseBoolean(env.SAPPHIRE_NEXUS_PUBLIC_MODE) === true || parseBoolean(env.VERCEL) === true;
}

export function publicDeploymentReason() {
  return "public deployment disables private local adapter probes";
}

function parseBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }
  return ["1", "true", "yes"].includes(value.toLowerCase());
}
