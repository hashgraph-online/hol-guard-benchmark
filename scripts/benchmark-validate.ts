#!/usr/bin/env tsx
/**
 * HOL Guard benchmark validation CLI.
 *
 * Validates that a fixture run has the required publication fields.
 *
 * Usage:
 *   bun run benchmark:validate
 *   bun run benchmark:validate -- --fixture
 *
 * Validates that the benchmark run has all required publication fields.
 */
import { runFixtureBenchmark, validateBenchmarkRun } from '../src/hol_guard_benchmark/runner.js';

function main(): void {
  const run = runFixtureBenchmark();

  try {
    validateBenchmarkRun(run);
    console.log('Benchmark validation passed.');
    console.log('  Results: ' + run.results.length);
    console.log('  Author: ' + run.author);
    console.log('  Reviewer: ' + run.technicalReviewer);
    console.log('  Test date: ' + run.testDate);
    process.exit(0);
  } catch (err) {
    console.error('Benchmark validation failed: ' + String(err));
    process.exit(1);
  }
}

main();
