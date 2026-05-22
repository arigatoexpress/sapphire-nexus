# Research Synthesis

Scan date: 2026-05-22

Inputs:

- Ari-owned GitHub repos exported to
  `/Users/aribs/Documents/Cowork/research/github-owned-repos-2026-05-22.json`.
- Ari-starred GitHub repos exported to
  `/Users/aribs/Documents/Cowork/research/github-starred-repos-2026-05-22.json`.
- GitHub top-starred, AI-agent, local-LLM, and quant-topic searches exported
  under `/Users/aribs/Documents/Cowork/research/`.
- Sidecar starred/trending research agent readback.

## Architecture Decision

Build Sapphire Nexus as a small code-first kernel:

- Hono/TypeScript API and workbench for contracts and operator readbacks.
- Ollama-compatible local model gateway first; vLLM/SGLang-compatible GPU
  gateway later when the Windows server is ready.
- Evidence and provenance ledger before memory sprawl.
- Paper-only quant research until explicit live-execution gates are opened.
- Purpose-built products stay separate and are consumed through contracts.

## Adopt As Interfaces

- `ollama/ollama` and `ggml-org/llama.cpp`: local inference.
- `vllm-project/vllm` or `sgl-project/sglang`: Windows/Linux GPU serving path.
- `qdrant/qdrant` and `lancedb/lancedb`: durable and embedded vector indexes.
- `langchain-ai/langgraph` and `pydantic/pydantic-ai`: agent workflow and typed
  tool-contract references.
- `dagster-io/dagster` or `PrefectHQ/prefect`: repeatable ingest, eval, and
  research workflow runners.
- `mlflow/mlflow`: experiment and eval registry.
- `microsoft/qlib`, `QuantConnect/Lean`, `polakowo/vectorbt`: quant research
  and backtesting references.

## Do Not Make Core

- Dify, Flowise, n8n, and Open WebUI: useful references, but too platform-like
  or license-constrained to become the nucleus.
- Freqtrade, TradingView automation, exchange bots, and Binance bot forks:
  reference only. They pull too hard toward live execution, exchange-key risk,
  Telegram side effects, and licensing friction.
- Hype-first clone repos or "free API" repos: inspiration at most until manually
  audited.

## Product Shape

The app should become:

1. A source-cited AI/market/repo intelligence workbench.
2. A local-model gateway that can route to Mac Ollama now and Windows GPU later.
3. A paper research lab for backtests, evals, and model comparisons.
4. A deployment-ready web surface only after local health, browser smoke, and
   source-rights checks pass.

## Local Repo Mining Results

Use directly as references:

- `agent-opportunity-exchange`: Hono API, contract catalog, policy preflight,
  preview-safety, and source-rights envelopes.
- `agent-runtime-control-plane`: runtime inventory, publication plan, and
  migration strategy.
- `regional-intel-workbench`: Pydantic source-health, dropped-provenance
  accounting, and read-only OODA packet shape.
- `Sapphire`: provenance helpers, tool registry validation, fresh runtime
  status, and public-boundary smoke scripts.
- `cyber-threat-bot`: public-source defensive cyber models and actionability
  scoring.

Keep separate and consume by contract:

- `0guard`
- `wildfire-watch`
- `megaeth-agent-guard`
- `sapphire-sentinel`
- `fedex-delivery-markets`
- `regional-intel-workbench`

Avoid as core architecture:

- current `Sapphire` runtime sprawl
- TradingView/CDP automation
- SapphireAlpha dashboard/template code
- old generated agent logs and context dumps

