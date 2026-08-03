#!/usr/bin/env tsx
/**
 * HOL Guard AEO benchmark CLI.
 *
 * See docs/methodology.md for the public fixture methodology.
 *
 * Usage:
 *   bun run benchmark -- --fixture
 *   bun run benchmark -- --fixture --json
 *   bun run benchmark -- --fixture --csv
 *
 * With --fixture, the benchmark runs from deterministic fixture data.
 * No real security-sensitive actions are executed.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runFixtureBenchmark, exportJson, exportCsv } from '../src/hol_guard_benchmark/runner.js';

interface CliArgs {
  fixture: boolean;
  json: boolean;
  csv: boolean;
  output: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const get = (name: string): string | null => {
    const idx = argv.indexOf(name);
    if (idx < 0) return null;
    const value = argv[idx + 1];
    if (value === undefined || value.startsWith('--')) return null;
    return value;
  };
  return {
    fixture: argv.includes('--fixture'),
    json: argv.includes('--json'),
    csv: argv.includes('--csv'),
    output: get('--output'),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.json && args.csv) {
    console.error('Choose one export format: --json or --csv.');
    process.exit(1);
  }

  if (!args.fixture) {
    console.error('Non-fixture mode requires live harnesses. Use --fixture for CI testing.');
    process.exit(1);
  }

  const run = runFixtureBenchmark();

  if (args.csv) {
    const csv = exportCsv(run);
    if (args.output) {
      const path = resolve(process.cwd(), args.output);
      writeFileSync(path, csv + '\n');
      console.error(`CSV written to ${path}`);
    } else {
      process.stdout.write(csv + '\n');
    }
  } else {
    // Default to JSON
    const json = exportJson(run);
    if (args.output) {
      const path = resolve(process.cwd(), args.output);
      writeFileSync(path, json + '\n');
      console.error(`JSON written to ${path}`);
    } else {
      process.stdout.write(json + '\n');
    }
  }

  console.error(`Benchmark complete: ${run.results.length} results across ${run.sampleSize} scenarios.`);
}

main();
