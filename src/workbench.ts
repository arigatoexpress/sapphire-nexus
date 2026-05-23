import type { Landscape } from "./contracts.js";
import { buildClientBrief, buildOperatorNextActions, buildSafetyBoundary, buildVerificationManifest } from "./contracts.js";
import type { buildDeploymentIdentity } from "./deployment.js";
import type { checkNexusReadiness } from "./readiness.js";

type ReadinessReport = Awaited<ReturnType<typeof checkNexusReadiness>>;
type DeploymentIdentity = ReturnType<typeof buildDeploymentIdentity>;

export function renderWorkbench(landscape: Landscape, readiness: ReadinessReport, deployment: DeploymentIdentity) {
  const safety = buildSafetyBoundary();
  const reusable = landscape.ownedRepoSignals.filter((repo) => !repo.repo.includes("0guard") && !repo.repo.includes("wildfire"));
  const topOpenSource = landscape.openSourceShortlist.slice(0, 6);
  const readinessTone = readiness.status === "ready" ? "ready" : "degraded";
  const clientBrief = buildClientBrief(deployment.origin, landscape);
  const verification = buildVerificationManifest(deployment.origin);
  const nextActions = buildOperatorNextActions();
  const apiLinks = [
    { label: "OpenAPI", path: "/openapi.json", detail: "client contract" },
    { label: "Discovery", path: "/.well-known/sapphire-nexus.json", detail: "route map" },
    { label: "Client Brief", path: "/v1/client/brief", detail: "public handoff" },
    { label: "Verification", path: "/v1/verification-manifest", detail: "claim checks" },
    { label: "Readiness", path: "/v1/readiness", detail: "operator status" },
    { label: "Deployment", path: "/v1/deployment", detail: "live revision" },
    { label: "Public Sources", path: "/v1/adapters/public-sources/readiness", detail: "rights posture" },
    { label: "Next Actions", path: "/v1/operator/next-actions", detail: "operator queue" },
    { label: "LLMs", path: "/llms.txt", detail: "AI-readable guide" },
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sapphire Nexus</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0c0d10;
      --panel: #15171c;
      --panel-2: #1d2027;
      --text: #f4f7fb;
      --muted: #a9b2c3;
      --line: #2b3039;
      --cyan: #57d6ff;
      --green: #67e8a5;
      --gold: #f6c85f;
      --red: #ff6b6b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      letter-spacing: 0;
    }
    main { min-height: 100vh; }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--line);
      background: #101216;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .mark {
      width: 34px;
      height: 34px;
      border: 1px solid #40505f;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #111a20;
      color: var(--cyan);
      font-weight: 800;
    }
    h1 { margin: 0; font-size: 18px; font-weight: 720; }
    .subtle { color: var(--muted); font-size: 13px; }
    .status { display: flex; align-items: center; gap: 8px; color: var(--green); font-size: 13px; white-space: nowrap; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
    .status.degraded { color: var(--gold); }
    .status.degraded .dot { background: var(--gold); }
    .grid {
      display: grid;
      grid-template-columns: minmax(280px, 1.15fr) minmax(280px, 0.85fr);
      gap: 18px;
      padding: 22px;
    }
    section {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      overflow: hidden;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-2);
    }
    h2 { margin: 0; font-size: 14px; font-weight: 700; }
    .body { padding: 16px; }
    .thesis {
      font-size: 30px;
      line-height: 1.12;
      max-width: 920px;
      margin: 0 0 16px;
    }
    .principles {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .pill {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #101216;
      padding: 10px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-size: 12px; font-weight: 650; }
    td { color: #dce5f2; }
    tr:last-child td { border-bottom: 0; }
    .tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid #314153;
      color: var(--cyan);
      font-size: 12px;
      margin: 0 4px 4px 0;
      background: #111a20;
    }
    .danger { color: var(--red); }
    .gold { color: var(--gold); }
    .stack { display: grid; gap: 18px; }
    .metric-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .metric { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: #101216; }
    .metric strong { display: block; font-size: 22px; margin-bottom: 4px; }
    .identity-grid { display: grid; gap: 10px; }
    .identity-item {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 10px;
      align-items: baseline;
      border-bottom: 1px solid var(--line);
      padding: 0 0 9px;
      font-size: 13px;
    }
    .identity-item:last-child { border-bottom: 0; padding-bottom: 0; }
    .identity-label { color: var(--muted); font-size: 12px; }
    .route-list { display: grid; gap: 8px; }
    .route-link {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: #101216;
      color: var(--text);
      text-decoration: none;
      min-height: 46px;
    }
    .route-link:hover, .route-link:focus-visible { border-color: #40505f; outline: none; }
    .route-title { display: block; color: #dce5f2; font-size: 13px; }
    .route-path { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
    .route-detail { color: var(--cyan); font-size: 12px; white-space: nowrap; }
    .mono {
      color: #dce5f2;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }
    .check-list { display: grid; gap: 8px; margin-top: 12px; }
    .check {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: #101216;
      min-height: 44px;
    }
    .check-name { min-width: 0; color: #dce5f2; font-size: 13px; }
    .check-detail { margin-top: 4px; color: var(--muted); font-size: 12px; line-height: 1.35; }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 84px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid #314153;
      color: var(--cyan);
      font-size: 12px;
      background: #111a20;
      white-space: nowrap;
    }
    .badge.ready { color: var(--green); border-color: #2c6148; }
    .badge.degraded, .badge.unreachable, .badge.disabled, .badge.blocked { color: var(--gold); border-color: #655229; }
    @media (max-width: 860px) {
      .grid { grid-template-columns: 1fr; padding: 14px; }
      .principles, .metric-row { grid-template-columns: 1fr; }
      .identity-item { grid-template-columns: 1fr; gap: 4px; }
      .route-link { grid-template-columns: 1fr; }
      .route-detail { white-space: normal; }
      .topbar { align-items: flex-start; flex-direction: column; }
      .thesis { font-size: 24px; }
    }
  </style>
</head>
<body>
<main>
  <div class="topbar">
    <div class="brand">
      <div class="mark">SN</div>
      <div>
        <h1>Sapphire Nexus</h1>
        <div class="subtle">local-first intelligence kernel</div>
      </div>
    </div>
    <div class="status ${readinessTone}"><span class="dot"></span>${escapeHtml(readiness.status)} readiness · live actions disabled</div>
  </div>
  <div class="grid">
    <div class="stack">
      <section>
        <div class="section-head"><h2>Readiness</h2><span class="subtle">summary-only</span></div>
        <div class="body">
          <div class="metric-row">
            <div class="metric"><strong>${readiness.summary.ready}</strong><span class="subtle">ready checks</span></div>
            <div class="metric"><strong>${readiness.summary.degraded}</strong><span class="subtle">degraded checks</span></div>
            <div class="metric"><strong>${readiness.summary.disabled}</strong><span class="subtle">disabled checks</span></div>
          </div>
          <div class="check-list">
            ${readiness.checks
              .map(
                (check) =>
                  `<div class="check"><div class="check-name">${escapeHtml(check.label)}</div><span class="badge ${escapeHtml(check.status)}">${escapeHtml(check.status)}</span></div>`,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Operating Thesis</h2><span class="subtle">${escapeHtml(landscape.generatedAt)}</span></div>
        <div class="body">
          <p class="thesis">Mine the best contracts and research patterns. Leave the old weight behind.</p>
          <div class="principles">
            ${landscape.principles.map((value) => `<div class="pill">${escapeHtml(value)}</div>`).join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Repos To Mine</h2><span class="subtle">contract-first reuse</span></div>
        <div class="body">
          <table>
            <thead><tr><th>Repo</th><th>Use</th><th>Avoid</th></tr></thead>
            <tbody>
              ${reusable
                .map(
                  (repo) => `<tr><td>${escapeHtml(repo.repo)}</td><td>${repo.mine
                    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
                    .join("")}</td><td>${escapeHtml(repo.avoid[0] ?? "")}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <div class="stack">
      <section>
        <div class="section-head"><h2>Boundary State</h2><span class="subtle">hard stops</span></div>
        <div class="body">
          <div class="metric-row">
            <div class="metric"><strong>${Object.values(safety).filter((value) => value === false).length}</strong><span class="subtle">disabled live actions</span></div>
            <div class="metric"><strong>${landscape.protectedLanes.length}</strong><span class="subtle">protected lanes</span></div>
            <div class="metric"><strong>${landscape.openSourceShortlist.length}</strong><span class="subtle">candidate references</span></div>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Deployment Identity</h2><span class="subtle">${escapeHtml(deployment.runtime.provider)}</span></div>
        <div class="body">
          <div class="identity-grid">
            <div class="identity-item"><span class="identity-label">Origin</span><span class="mono">${escapeHtml(deployment.origin)}</span></div>
            <div class="identity-item"><span class="identity-label">Service</span><span class="mono">${escapeHtml(displayValue(deployment.runtime.service))}</span></div>
            <div class="identity-item"><span class="identity-label">Revision</span><span class="mono">${escapeHtml(displayValue(deployment.runtime.revision))}</span></div>
            <div class="identity-item"><span class="identity-label">Mode</span><span class="mono">${deployment.mode.publicDeployment ? "public" : "local"} · live actions disabled</span></div>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Client Brief</h2><span class="subtle">public-safe handoff</span></div>
        <div class="body">
          <div class="pill">${escapeHtml(clientBrief.product.oneLine)}</div>
          <div class="check-list">
            ${clientBrief.capabilities
              .map(
                (capability) =>
                  `<div class="check"><div><div class="check-name">${escapeHtml(capability.label)}</div><div class="check-detail">${escapeHtml(capability.clientValue)}</div></div><span class="badge ${escapeHtml(capability.status)}">${escapeHtml(capability.status)}</span></div>`,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Verification</h2><span class="subtle">claim checks</span></div>
        <div class="body">
          <div class="metric-row">
            <div class="metric"><strong>${verification.summary.checks}</strong><span class="subtle">public checks</span></div>
            <div class="metric"><strong>${verification.summary.requiredHeaders}</strong><span class="subtle">hardening headers</span></div>
            <div class="metric"><strong>0</strong><span class="subtle">live actions</span></div>
          </div>
          <div class="check-list">
            ${verification.checks
              .slice(0, 4)
              .map(
                (check) =>
                  `<div class="check"><div><div class="check-name">${escapeHtml(check.id)}</div><div class="check-detail">${escapeHtml(check.route)} · ${escapeHtml(check.proves)}</div></div><span class="badge ready">check</span></div>`,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>API Surface</h2><span class="subtle">public contracts</span></div>
        <div class="body">
          <div class="route-list">
            ${apiLinks
              .map(
                (link) =>
                  `<a class="route-link" href="${escapeHtml(link.path)}"><span><span class="route-title">${escapeHtml(link.label)}</span><span class="route-path">${escapeHtml(link.path)}</span></span><span class="route-detail">${escapeHtml(link.detail)}</span></a>`,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Next Actions</h2><span class="subtle">agent-safe vs Ari-only</span></div>
        <div class="body">
          <div class="check-list">
            ${nextActions.actions
              .map(
                (action) =>
                  `<div class="check"><div><div class="check-name">${escapeHtml(action.label)}</div><div class="check-detail">${escapeHtml(action.lane)} · ${escapeHtml(action.reason)}</div></div><span class="badge ${escapeHtml(action.status)}">${escapeHtml(action.status)}</span></div>`,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Open Source Shortlist</h2><span class="subtle">do not vendor blindly</span></div>
        <div class="body">
          <table>
            <thead><tr><th>Project</th><th>Category</th><th>Fit</th></tr></thead>
            <tbody>
              ${topOpenSource
                .map(
                  (repo) => `<tr><td>${escapeHtml(repo.repo)}<br><span class="subtle">${repo.stars.toLocaleString()} stars</span></td><td class="gold">${escapeHtml(repo.category)}</td><td>${escapeHtml(repo.fit)}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Blocked Claims</h2><span class="subtle">fail closed</span></div>
        <div class="body">
          ${Object.keys(safety)
            .map((key) => `<span class="tag danger">${escapeHtml(key)}</span>`)
            .join("")}
        </div>
      </section>
      <section>
        <div class="section-head"><h2>Reference Only</h2><span class="subtle">avoid core sprawl</span></div>
        <div class="body">
          <table>
            <thead><tr><th>Project</th><th>Reason</th></tr></thead>
            <tbody>
              ${(landscape.notCore ?? [])
                .map((repo) => `<tr><td>${escapeHtml(repo.repo)}</td><td>${escapeHtml(repo.reason)}</td></tr>`)
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</main>
</body>
</html>`;
}

function displayValue(value: string | null) {
  return value ?? "not set";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
