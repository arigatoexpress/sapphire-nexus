const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error("usage: npm run smoke:production -- https://deployment-url");
  process.exit(2);
}

const expectedOrigin = new URL(baseUrl).origin;

const checks = [
  { id: "health", path: "/health", validate: (body) => body.status === "ok" && body.liveActionsEnabled === false },
  {
    id: "discovery",
    path: "/.well-known/sapphire-nexus.json",
    validate: (body) => body.origin === expectedOrigin && body.routes?.readiness === "/v1/readiness",
  },
  {
    id: "readiness",
    path: "/v1/readiness",
    validate: (body) => body.schemaId === "sapphire.nexus.readiness.v1" && body.safety?.liveActionsEnabled === false,
  },
  {
    id: "publicSources",
    path: "/v1/adapters/public-sources/readiness",
    validate: (body) =>
      body.schemaId === "sapphire.nexus.adapter.public_sources.v1" &&
      body.summary?.status === "ready" &&
      body.safety?.rawPayloadsStored === false,
  },
  { id: "workbench", path: "/", validateText: (text) => text.includes("Sapphire Nexus") && text.includes("Readiness") },
  {
    id: "llms",
    path: "/llms.txt",
    validateText: (text) =>
      text.includes("Sapphire Nexus") && text.includes(expectedOrigin) && text.includes("live actions disabled"),
  },
  {
    id: "robots",
    path: "/robots.txt",
    validateText: (text) => text.includes("User-agent: *") && text.includes(`llms.txt: ${expectedOrigin}/llms.txt`),
  },
];

const results = [];
for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { accept: check.validateText ? "text/plain, text/html" : "application/json" } });
    const elapsedMs = Date.now() - started;
    if (check.validateText) {
      const text = await response.text();
      results.push({ id: check.id, status: response.status, ok: response.ok && check.validateText(text), elapsedMs });
    } else {
      const body = await response.json();
      results.push({ id: check.id, status: response.status, ok: response.ok && check.validate(body), elapsedMs });
    }
  } catch (error) {
    results.push({ id: check.id, status: null, ok: false, elapsedMs: Date.now() - started, error: error.name });
  }
}

const ok = results.every((result) => result.ok);
console.log(JSON.stringify({ ok, baseUrl, results }, null, 2));
if (!ok) {
  process.exit(1);
}
