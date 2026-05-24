import { CLIENT_DEMO_SCHEMA_ID, buildBlockedClaims, buildSafetyBoundary } from "./contracts.js";

export function buildClientDemo(origin: string, now = new Date()) {
  const steps = [
    demoStep({
      id: "open-workbench",
      label: "Open the operator workbench",
      route: "/",
      proof: "The first screen renders readiness, deployment identity, public route links, and hard safety boundaries.",
      talkTrack: "Start with the live workbench, then follow only public routes that are safe to share.",
    }),
    demoStep({
      id: "verify-revision",
      label: "Verify deployment identity",
      route: "/v1/deployment",
      proof: "The service exposes provider, service, revision, public mode, and disabled live actions without dumping environment values.",
      talkTrack: "Use this route before claiming which Cloud Run revision is serving production.",
    }),
    demoStep({
      id: "show-client-brief",
      label: "Show the client-safe brief",
      route: "/v1/client/brief",
      proof: "The product value is described without promising trading, messaging, payments, wallet signing, or private infrastructure access.",
      talkTrack: "This is the shortest public handoff for what Nexus is and is not.",
    }),
    demoStep({
      id: "review-data-freshness",
      label: "Review data freshness",
      route: "/v1/data/freshness",
      proof: "Checked-in snapshots are marked with TTLs, caveats, hashes, and manual-refresh requirements.",
      talkTrack: "Use this before making current client claims from checked-in metadata.",
    }),
    demoStep({
      id: "review-refresh-plan",
      label: "Review the metadata refresh plan",
      route: "/v1/data/refresh-plan",
      proof: "Refresh work is official-source, reviewed, metadata-only, and requires source-rights evidence before current claims.",
      talkTrack: "This explains how stale snapshots become refreshed PR evidence without raw payload dumps.",
    }),
    demoStep({
      id: "close-with-verification",
      label: "Close with verification and next actions",
      route: "/v1/verification-manifest",
      proof: "The public smoke checklist, hardening headers, and revision-aware verification command are published.",
      talkTrack: "End with what has been verified and which decisions remain Ari-only.",
    }),
  ];

  return {
    schemaId: CLIENT_DEMO_SCHEMA_ID,
    generatedAt: now.toISOString(),
    origin,
    summary: {
      status: "ready",
      steps: steps.length,
      publicRoutesOnly: true,
      clientSafe: true,
      liveActionsEnabled: false,
      requiresRevisionVerification: true,
    },
    demo: {
      title: "Sapphire Nexus Client Demo",
      durationMinutes: 8,
      startingRoute: "/",
      closingRoutes: ["/v1/verification-manifest", "/v1/operator/next-actions"],
      successCriteria: [
        "workbench renders the current deployment revision",
        "client brief and verification manifest are public",
        "freshness and refresh-plan caveats are visible before current claims",
        "Ari-only decisions remain separated from agent-safe work",
      ],
    },
    steps,
    safety: {
      ...buildSafetyBoundary(),
      readsSecrets: false,
      sendsExternalMessages: false,
      mutatesRuntime: false,
      exposesPrivateInfrastructure: false,
      promisesProductionTrading: false,
      claimsCurrentTrendWithoutRefresh: false,
    },
    policy: {
      publicSafe: true,
      revisionVerificationRequiredBeforeProductionClaims: true,
      noLiveActionsDuringDemo: true,
      blockedClaims: buildBlockedClaims(),
      ariOnlyDecisions: ["custom domain choice", "manual vs auto-promote deployment policy", "any live trading, wallet, payment, or customer-send lane"],
    },
  };
}

function demoStep(input: { id: string; label: string; route: string; proof: string; talkTrack: string }) {
  return {
    ...input,
    method: "GET",
    publicSafe: true,
    blockedClaims: ["live execution", "private data access", "secret-backed action", "current data claim without freshness review"],
  };
}
