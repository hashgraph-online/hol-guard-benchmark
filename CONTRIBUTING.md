# Contributing to HOL Guard Benchmark

Thanks for helping make the benchmark reproducible and honest about its limits.

## Development setup

Install Bun 1.3.14 or newer:

```bash
bun install
```

## Validation

Run the fixture export, validation, tests, and typecheck before opening a pull request:

```bash
bun run benchmark -- --fixture --json
bun run benchmark:validate
bun run test
bun run typecheck
```

Scenario changes must include tests and explain whether they change the published result cardinality or schema. Keep fixture data fake and deterministic. Do not claim a live measurement unless the run includes harness versions, setup observations, raw records, and an explicit data-egress statement.

## Pull requests

Open a pull request against `main` with a concise description of the evidence contract changed, the limitations, and the exact validation commands run. Do not commit secrets, environment files, or generated local tooling directories.

## License

By contributing, you agree that your contributions are licensed under Apache-2.0.
