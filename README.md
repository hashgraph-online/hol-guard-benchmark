# HOL Guard Benchmark: Fixture Evidence

[![CI](https://img.shields.io/github/actions/workflow/status/hashgraph-online/hol-guard-benchmark/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white)](https://github.com/hashgraph-online/hol-guard-benchmark/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hashgraph-online/hol-guard-benchmark/badge)](https://scorecard.dev/viewer/?uri=github.com/hashgraph-online/hol-guard-benchmark)

| ![HOL Guard logo](https://hol.org/brand/Logo_Whole_Dark.png) | **A public, inspectable fixture benchmark for AI-agent runtime security.** This repository owns the scenarios, result contract, deterministic runner, and versioned exports shown in the HOL Guard research pages.<br><br>[Read the methodology](https://hol.org/guard/research/methodology)<br>[View the benchmark report](https://hol.org/guard/research/ai-coding-agent-runtime-security-benchmark)<br>[Report an issue](https://github.com/hashgraph-online/hol-guard-benchmark/issues) |
| :--- | :--- |

## What this repository is

This is the public source for HOL Guard's fixture benchmark. It defines 11 fake-data scenarios across five harness rows and four comparator policies, then exports one validated result model as JSON or CSV.

Fixture mode is deterministic and safe to run locally. It does not read real secrets, execute attacks, invoke Codex/Claude/Cursor/Gemini/OpenCode, or measure production latency. Values named `medianLatencyMs` and `p95LatencyMs` are explicit fixture placeholders. This repository must not be cited as independent third-party validation.

## Run it locally

Install Bun 1.3.14 or newer, then run:

```bash
bun install
bun run benchmark -- --fixture --json
bun run benchmark -- --fixture --csv
bun run benchmark:validate
```

To regenerate the checked-in snapshot files:

```bash
bun run data:json
bun run data:csv
```

Run the checks before opening a pull request:

```bash
bun run test
bun run typecheck
```

## Repository layout

| Path | Purpose |
| :--- | :--- |
| `src/hol_guard_benchmark/scenarios.ts` | Scenario, harness, comparator, taxonomy, and metric definitions |
| `src/hol_guard_benchmark/runner.ts` | Deterministic fixture runner, validation, JSON, and CSV exports |
| `scripts/` | Human-facing benchmark and validation commands |
| `data/` | Versioned fixture exports generated from the runner |
| `schema/` | Publication schema for exported runs |
| `tests/` | Scenario, coverage, determinism, validation, and export tests |
| `docs/methodology.md` | Repository-local methodology and limitations |

## Evidence boundary

The current release demonstrates that a documented fixture matrix can be normalized and published reproducibly. It does not demonstrate live harness behavior, exploit resistance, real-world false-positive rates, network/container/OS isolation, or independent review. Future live adapters must publish their harness versions, setup steps, raw observations, environment, data-egress statement, and a separate run identifier rather than silently replacing fixture output.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before changing scenarios or result semantics. Report security issues privately using [SECURITY.md](./SECURITY.md); do not open a public issue for a vulnerability.

## License

This project is released under the [Apache License 2.0](./LICENSE).
