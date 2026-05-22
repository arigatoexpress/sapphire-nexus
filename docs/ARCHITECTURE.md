# Architecture

Sapphire Nexus starts as a small local-first system:

1. **Contracts**: stable JSON responses for health, thesis, landscape, model
   gateway, and market-research posture.
2. **Evidence Ledger**: source ids, repo links, retrieval notes, and safety
   caveats. No raw private payload dumps.
3. **Local Model Gateway**: Ollama-compatible endpoint today; Windows GPU or
   vLLM-compatible endpoint later.
4. **Workbench**: dense operator UI that shows readiness, source posture, and
   blocked live-action claims.
5. **Adapters**: future adapters consume AOE, agent-runtime-control-plane,
   OpenBB/market data, and local model gateways through contracts.

## First Integration Targets

- `agent-opportunity-exchange`: paid artifact contracts and preview safety.
- `agent-runtime-control-plane`: runtime inventory and publication plan.
- `Sapphire`: legacy readiness and safety patterns only.
- `market-atlas-ai`, `AI-Benchmark`, `OpenBB`, `Kronos`: source material for
  research adapters, not copied wholesale.

## Non-Negotiables

- THO / Project-Go-Forward stays quarantined.
- Market outputs are research, not advice or execution.
- Local model serving is a gateway contract, not a hard dependency.
- GCP is a deploy option after local verification, not the first dependency.

