/**
 * HOL Guard AEO benchmark result model and runner.
 *
 * See docs/methodology.md for the public fixture methodology.
 *
 * The runner executes scenarios against comparators and records results.
 * Results are exported as validated JSON and CSV from the same model.
 * Raw records are anonymous and free of secrets.
 */

import type {
  BenchmarkScenario,
  BenchmarkScenarioId,
  BenchmarkHarnessId,
  BenchmarkComparator,
  BenchmarkOutcome,
} from './scenarios.js';
import {
  BENCHMARK_SCENARIOS,
  BENCHMARK_HARNESSES,
  BENCHMARK_COMPARATORS,
} from './scenarios.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface BenchmarkResult {
  readonly scenarioId: BenchmarkScenarioId;
  readonly harnessId: BenchmarkHarnessId;
  readonly comparator: BenchmarkComparator;
  readonly outcome: BenchmarkOutcome;
  readonly medianLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly receiptCreated: boolean;
  readonly notes: string;
}

export interface BenchmarkRun {
  readonly schemaVersion: string;
  readonly runId: string;
  readonly runTimestamp: string;
  readonly author: string;
  readonly technicalReviewer: string;
  readonly testDate: string;
  readonly os: string;
  readonly versions: Record<string, string>;
  readonly hardware: string;
  readonly policyConfig: string;
  readonly sampleSize: number;
  readonly methodology: string;
  readonly limitations: string;
  readonly failures: string;
  readonly updateSchedule: string;
  readonly results: readonly BenchmarkResult[];
}

// ---------------------------------------------------------------------------
// Fixture-based runner
// ---------------------------------------------------------------------------

const BENCHMARK_SCHEMA_VERSION = '2026.07.26.1';

/**
 * Run the benchmark in fixture mode.
 *
 * Fixture mode produces deterministic results from predefined scenario
 * outcomes. It does NOT execute any real security-sensitive actions.
 * All fixtures contain only fake data — no real secrets.
 */
export function runFixtureBenchmark(): BenchmarkRun {
  const results: BenchmarkResult[] = [];

  for (const harness of BENCHMARK_HARNESSES) {
    if (!harness.eligible) continue;

    for (const comparator of BENCHMARK_COMPARATORS) {
      for (const scenario of BENCHMARK_SCENARIOS) {
        results.push(runScenario(scenario, harness.id, comparator.id));
      }
    }
  }

  return {
    schemaVersion: BENCHMARK_SCHEMA_VERSION,
    runId: 'fixture-run-2026-07-26-001',
    runTimestamp: '2026-07-26T00:00:00Z',
    author: 'HOL Guard Team',
    technicalReviewer: 'HOL Guard Team',
    testDate: '2026-07-26',
    os: 'fixture-mode (no real OS)',
    versions: {
      hol_guard: 'fixture',
      codex: 'fixture',
      claude_code: 'fixture',
      cursor: 'fixture',
      gemini_cli: 'fixture',
      opencode: 'fixture',
    },
    hardware: 'fixture-mode (no real hardware)',
    policyConfig: 'fixture-default',
    sampleSize: results.length,
    methodology: 'Fixture-based deterministic benchmark. No real security-sensitive actions are executed. All fixtures contain only fake data.',
    limitations: 'Fixture mode does not measure real latency. Latency values are placeholders. Real benchmark runs require live harnesses.',
    failures: 'None in fixture mode.',
    updateSchedule: 'Monthly or upon major harness version changes.',
    results,
  };
}

/**
 * Run a single scenario against a comparator and record the result.
 *
 * In fixture mode, outcomes are deterministic based on the comparator type:
 * - native_default: risky actions are allowed (no protection)
 * - native_strict: some risky actions are prevented (harness built-in)
 * - guard_default: risky actions are prevented or prompted
 * - guard_strict: risky actions are prevented
 */
function runScenario(
  scenario: BenchmarkScenario,
  harnessId: BenchmarkHarnessId,
  comparator: BenchmarkComparator,
): BenchmarkResult {
  const outcome = determineOutcome(scenario, comparator);
  const receiptCreated = outcome === 'prompted' || outcome === 'allowed'
    ? comparator === 'guard_default' || comparator === 'guard_strict'
    : false;

  return {
    scenarioId: scenario.id,
    harnessId,
    comparator,
    outcome,
    medianLatencyMs: getFixtureLatency(comparator),
    p95LatencyMs: getFixtureLatency(comparator) * 1.5,
    receiptCreated,
    notes: getScenarioNotes(scenario, comparator, outcome),
  };
}

function determineOutcome(
  scenario: BenchmarkScenario,
  comparator: BenchmarkComparator,
): BenchmarkOutcome {
  // Safe actions should always be allowed (no false positives)
  if (scenario.riskClass === 'safe_control') {
    return 'allowed';
  }

  // Receipt verification is always allowed
  if (scenario.riskClass === 'receipt_creation') {
    return 'allowed';
  }

  switch (comparator) {
    case 'native_default':
      // Native default: no protection, risky actions allowed
      return 'allowed';
    case 'native_strict':
      // Native strict: some harnesses have built-in protections
      if (scenario.riskClass === 'secret_access') return 'detection_only';
      if (scenario.riskClass === 'risky_shell') return 'prompted';
      return 'allowed';
    case 'guard_default':
      // Guard default: prevents secret access, prompts for others
      if (scenario.riskClass === 'secret_access') return 'prevented';
      if (scenario.riskClass === 'tool_poisoning') return 'prevented';
      if (scenario.riskClass === 'risky_shell') return 'prevented';
      return 'prompted';
    case 'guard_strict':
      // Guard strict: prevents all risky actions except approval flows
      if (scenario.riskClass === 'approval_control') return 'prompted';
      return 'prevented';
    default:
      return 'unsupported';
  }
}

function getFixtureLatency(comparator: BenchmarkComparator): number {
  switch (comparator) {
    case 'native_default': return 0;
    case 'native_strict': return 5;
    case 'guard_default': return 12;
    case 'guard_strict': return 15;
    default: return 0;
  }
}

function getScenarioNotes(
  scenario: BenchmarkScenario,
  comparator: BenchmarkComparator,
  outcome: BenchmarkOutcome,
): string {
  if (outcome === 'unsupported') {
    return `Scenario ${scenario.id} is not supported by ${comparator}.`;
  }
  if (outcome === 'false_positive') {
    return `False positive: safe action ${scenario.id} was incorrectly blocked by ${comparator}.`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a benchmark run for publication completeness.
 * @throws if required fields are missing or results are inconsistent.
 */
export function validateBenchmarkRun(run: BenchmarkRun): void {
  const errors: string[] = [];

  if (!run.author) errors.push('Missing author');
  if (!run.technicalReviewer) errors.push('Missing technical reviewer');
  if (!run.testDate) errors.push('Missing test date');
  if (!run.os) errors.push('Missing OS');
  if (!run.versions || Object.keys(run.versions).length === 0) errors.push('Missing versions');
  if (!run.hardware) errors.push('Missing hardware');
  if (!run.policyConfig) errors.push('Missing policy configuration');
  if (!run.sampleSize || run.sampleSize <= 0) errors.push('Missing or invalid sample size');
  if (!run.methodology) errors.push('Missing methodology');
  if (!run.limitations) errors.push('Missing limitations');
  if (!run.failures) errors.push('Missing failures field');
  if (!run.updateSchedule) errors.push('Missing update schedule');
  if (!run.results || run.results.length === 0) errors.push('Missing results');

  // Validate result consistency
  for (const result of run.results) {
    if (!result.scenarioId) errors.push(`Result missing scenarioId`);
    if (!result.harnessId) errors.push(`Result missing harnessId`);
    if (!result.comparator) errors.push(`Result missing comparator`);
    if (!result.outcome) errors.push(`Result missing outcome`);
  }

  if (errors.length > 0) {
    throw new Error(`Benchmark validation failed:\n  ${errors.join('\n  ')}`);
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Export benchmark results as JSON.
 */
export function exportJson(run: BenchmarkRun): string {
  validateBenchmarkRun(run);
  return JSON.stringify(run, null, 2);
}

/**
 * Export benchmark results as CSV.
 * Each row is one scenario/comparator/harness combination.
 */
export function exportCsv(run: BenchmarkRun): string {
  validateBenchmarkRun(run);
  const headers = [
    'scenario_id',
    'harness_id',
    'comparator',
    'outcome',
    'median_latency_ms',
    'p95_latency_ms',
    'receipt_created',
    'notes',
  ];
  const rows = run.results.map((r) => [
    r.scenarioId,
    r.harnessId,
    r.comparator,
    r.outcome,
    String(r.medianLatencyMs),
    String(r.p95LatencyMs),
    String(r.receiptCreated),
    `"${r.notes.replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
