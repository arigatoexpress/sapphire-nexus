export const AOE_ADAPTER_READINESS_SCHEMA_ID = "sapphire.nexus.adapter.aoe_readiness.v1";

type EndpointId = "health" | "discovery" | "readiness" | "contracts";

const AOE_ENDPOINTS: Array<{ id: EndpointId; path: string }> = [
  { id: "health", path: "/health" },
  { id: "discovery", path: "/.well-known/agent-opportunity-exchange.json" },
  { id: "readiness", path: "/v1/readiness" },
  { id: "contracts", path: "/v1/contracts" },
];

export async function checkAoeReadiness(options: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: Date;
} = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.SAPPHIRE_NEXUS_AOE_URL ?? "http://127.0.0.1:4402");
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 1_500;
  const endpointResults = await Promise.all(
    AOE_ENDPOINTS.map(async (endpoint) => {
      const url = `${baseUrl}${endpoint.path}`;
      const started = Date.now();
      try {
        const response = await fetchWithTimeout(fetchImpl, url, timeoutMs);
        const body = response.ok ? await safeJson(response) : {};
        return {
          id: endpoint.id,
          path: endpoint.path,
          status: response.ok ? "ready" : "unhealthy",
          statusCode: response.status,
          durationMs: Date.now() - started,
          summary: summarizeEndpoint(endpoint.id, body),
        };
      } catch (error) {
        return {
          id: endpoint.id,
          path: endpoint.path,
          status: "unreachable",
          statusCode: null,
          durationMs: Date.now() - started,
          summary: {
            error: error instanceof Error ? error.name : "unknown_error",
          },
        };
      }
    }),
  );
  const readyCount = endpointResults.filter((endpoint) => endpoint.status === "ready").length;

  return {
    schemaId: AOE_ADAPTER_READINESS_SCHEMA_ID,
    generatedAt: (options.now ?? new Date()).toISOString(),
    adapter: {
      id: "agent-opportunity-exchange",
      baseUrl,
      mode: "read_only_public_contract_summary",
      sourceRepo: "arigatoexpress/agent-opportunity-exchange",
    },
    safety: {
      readsSecrets: false,
      sendsPrompts: false,
      liveTradingAllowed: false,
      paymentSettlementAllowed: false,
      walletSigningAllowed: false,
      telegramSendsAllowed: false,
      storesRawContractBundle: false,
    },
    summary: {
      endpoints: endpointResults.length,
      ready: readyCount,
      degraded: endpointResults.length - readyCount,
      status: readyCount === endpointResults.length ? "ready" : readyCount > 0 ? "degraded" : "unreachable",
    },
    endpoints: endpointResults,
  };
}

function summarizeEndpoint(endpointId: EndpointId, body: Record<string, unknown>) {
  switch (endpointId) {
    case "health":
      return {
        schemaId: stringValue(body.schemaId),
        status: stringValue(body.status),
        service: stringValue(body.service),
        liveSettlementAllowed: booleanValue(body.liveSettlementAllowed),
        externalSideEffectsAllowed: booleanValue(body.externalSideEffectsAllowed),
      };
    case "discovery":
      return {
        schemaId: stringValue(body.schemaId),
        service: stringValue(body.service),
        routeCount: objectSize(body.routes),
        schemaIdCount: objectSize(body.schemaIds),
        freeEndpointCount: Array.isArray(body.freeEndpoints) ? body.freeEndpoints.length : 0,
      };
    case "readiness":
      return {
        schemaId: stringValue(body.schemaId),
        liveSettlementAllowed: booleanValue(body.liveSettlementAllowed),
        externalSideEffectsAllowed: booleanValue(body.externalSideEffectsAllowed),
        adapterCount: Array.isArray(body.adapters) ? body.adapters.length : 0,
        counts: plainRecord(body.counts),
        contracts: summarizeReadinessContracts(plainRecord(body.contracts)),
      };
    case "contracts":
      return {
        schemaId: stringValue(body.schemaId),
        bundleVersion: stringValue(body.bundleVersion),
        liveSettlementAllowed: booleanValue(body.liveSettlementAllowed),
        externalSideEffectsAllowed: booleanValue(body.externalSideEffectsAllowed),
        pathContractCount: Array.isArray(body.pathContracts) ? body.pathContracts.length : 0,
        schemaCatalogCount: objectSize(body.schemaCatalog),
        coverage: plainRecord(body.coverage),
        paymentBoundary: summarizePaymentBoundary(plainRecord(body.paymentBoundary)),
      };
  }
}

function summarizeReadinessContracts(contracts: Record<string, unknown>) {
  return {
    buyerDiscoveryReady: booleanValue(contracts.buyerDiscoveryReady),
    routeSchemasCovered: booleanValue(contracts.routeSchemasCovered),
    productSchemasCovered: booleanValue(contracts.productSchemasCovered),
  };
}

function summarizePaymentBoundary(paymentBoundary: Record<string, unknown>) {
  return {
    liveSettlementAllowed: booleanValue(paymentBoundary.liveSettlementAllowed),
    mainnetAllowed: booleanValue(paymentBoundary.mainnetAllowed),
    acceptedTestnet: stringValue(paymentBoundary.acceptedTestnet),
    serverPrivateKeyRequired: booleanValue(paymentBoundary.serverPrivateKeyRequired),
  };
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value = await response.json();
    return plainRecord(value);
  } catch {
    return {};
  }
}

function plainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function objectSize(value: unknown) {
  return Object.keys(plainRecord(value)).length;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

