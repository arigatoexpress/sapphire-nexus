# Filesystem Taxonomy

Scan date: 2026-05-22

This file records the read-only filesystem cleanup map for reducing drift and
context poisoning without deleting useful source history.

## Target Layout

- `/Users/aribs/Code/Sapphire`: legacy command/source reference, not the new
  nucleus.
- `/Users/aribs/Code/sapphire-nexus`: clean next-generation intelligence
  kernel.
- `/Users/aribs/Code/{0guard,wildfire-watch,regional-intel-workbench,...}`:
  sibling product repos.
- `/Users/aribs/Code/_worktrees/<repo-purpose>`: intentional PR worktrees.
- `/Users/aribs/.codex/worktrees/<id>/<repo>`: ephemeral active Codex worktrees.
- `/Users/aribs/Documents/Cowork/<topic-date>`: durable handoffs and evidence.
- `/Users/aribs/Code/_cleanup_backups`: patch and archive quarantine.

## Safe Cleanup Candidates

Only after confirming no active process uses the path:

- non-PGF `node_modules`
- non-PGF `.venv`
- `.pytest_cache`, `.ruff_cache`, `.mypy_cache`, `__pycache__`
- `coverage`, `.coverage`, `coverage.xml`, `test-results`
- reproducible `dist` and `build` outputs
- tool caches pruned with native tooling: `.cache/uv`, `.npm/_cacache`,
  `.npm/_npx`, `.cache/pre-commit`, `.cache/puppeteer`,
  `.cache/codex-runtimes`

## Hard Stops

Do not manually delete or move:

- THO / Project-Go-Forward paths or archives.
- dirty worktrees without patch/status/untracked manifests.
- active `.codex/worktrees`; `lsof` showed live Codex and Node handles during
  the scan.
- `.codex/memories`, `.codex/sessions`, and Codex SQLite logs without a
  Codex-aware retention process.
- secrets, keys, wallets, auth files, `.ssh`, `.gnupg`, `.kube`, `.mcp-auth`,
  model credentials, production deploy artifacts, Firestore/GCS/DNS/GCP assets.
- anything tied to live trading, signing, Telegram/customer sends, or money
  movement.

## Highest-Noise Paths

| Path | Size | Decision |
| --- | ---: | --- |
| `/Users/aribs/.ollama/models` | 47G | model cache; prune intentionally by model |
| `/Users/aribs/.cache/uv` | 10G | reproducible tool cache |
| `/Users/aribs/.gemini/antigravity-*` | ~26G | legacy context/cache; archive decision |
| `/Users/aribs/.npm/_cacache` | 2.9G | reproducible tool cache |
| `/Users/aribs/.codex/sessions` | 2.3G | Codex history; rotate carefully |
| `/Users/aribs/.codex/logs_2.sqlite` | 1.5G | Codex DB; do not manual-delete |
| `/Users/aribs/.codex/worktrees` | 1.5G | active worktrees |
| `/Users/aribs/Code/_cleanup_backups/project-go-forward-*` | 1.3G | PGF protected archive |
| `/Users/aribs/Code/Sapphire/data/.gcp_stage` | 247M | GCP-adjacent generated data; quarantine or retain latest-window first |

## Cleanup Procedure

1. Capture `git status --short --branch`, `git rev-parse HEAD`, remotes, and
   `git worktree list`.
2. For dirty repos, write a patch plus untracked manifest before archive.
3. Confirm no active process owns the target with `lsof`.
4. Move ambiguous context to a dated archive; delete only reproducible residue.
5. Update a Cowork handoff with what moved, what stayed, and rollback path.

