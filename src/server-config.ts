export function resolveServerConfig(env = process.env) {
  return {
    host: env.SAPPHIRE_NEXUS_HOST ?? (env.K_SERVICE ? "0.0.0.0" : "127.0.0.1"),
    port: Number.parseInt(env.SAPPHIRE_NEXUS_PORT ?? env.PORT ?? "4420", 10),
  };
}
