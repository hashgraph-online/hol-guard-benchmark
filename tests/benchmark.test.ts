/**
 * Tests for the HOL Guard fixture benchmark.
 *
 * Acceptance evidence:
 *   - One command reproduces fixture results.
 *   - JSON and CSV contain the same scenario/result cardinality.
 *   - Validation fails when versions, methodology fields, limitations,
 *     or raw artifacts are missing.
 */
import { describe, it, expect } from 'vitest';
import {
  runFixtureBenchmark,
  validateBenchmarkRun,
  exportJson,
  exportCsv,
  type BenchmarkRun,
} from '../src/hol_guard_benchmark/runner.js';
import {
  BENCHMARK_SCENARIOS,
  BENCHMARK_HARNESSES,
  BENCHMARK_COMPARATORS,
  BENCHMARK_METRICS,
  BENCHMARK_OUTCOME_DEFINITIONS,
  BENCHMARK_RISK_CLASS_DEFINITIONS,
} from '../src/hol_guard_benchmark/scenarios.js';

describe('hol-guard-benchmark', () => {
  describe('scenario completeness', () => {
    it('covers all required scenario classes', () => {
      const riskClasses = new Set(BENCHMARK_SCENARIOS.map((s) => s.riskClass));
      expect(riskClasses).toContain('secret_access');
      expect(riskClasses).toContain('risky_shell');
      expect(riskClasses).toContain('mcp_server_change');
      expect(riskClasses).toContain('tool_poisoning');
      expect(riskClasses).toContain('package_risk');
      expect(riskClasses).toContain('safe_control');
      expect(riskClasses).toContain('approval_control');
      expect(riskClasses).toContain('receipt_creation');
    });

    it('has 11 scenarios in the published fixture matrix', () => {
      expect(BENCHMARK_SCENARIOS.length).toBe(11);
    });

    it('every scenario has a fixture hash', () => {
      for (const s of BENCHMARK_SCENARIOS) {
        expect(s.fixtureHash).toBeTruthy();
        expect(s.fixtureHash).toMatch(/^sha256:/);
      }
    });

    it('every scenario has fixture contents with no real secrets', () => {
      for (const s of BENCHMARK_SCENARIOS) {
        expect(Object.keys(s.fixtureContents).length).toBeGreaterThan(0);
        // Fixture contents must contain "fixture" to indicate fake data
        const allContent = JSON.stringify(s.fixtureContents);
        expect(allContent.toLowerCase()).toContain('fixture');
      }
    });
  });

  describe('harness and comparator coverage', () => {
    it('covers all reproducible harnesses', () => {
      const eligible = BENCHMARK_HARNESSES.filter((h) => h.eligible);
      expect(eligible.length).toBe(5);
      const ids = eligible.map((h) => h.id);
      expect(ids).toContain('codex');
      expect(ids).toContain('claude_code');
      expect(ids).toContain('cursor');
      expect(ids).toContain('gemini_cli');
      expect(ids).toContain('opencode');
    });

    it('has 4 comparators', () => {
      expect(BENCHMARK_COMPARATORS.length).toBe(4);
    });

    it('metrics cover the published result contract', () => {
      const metricIds = new Set(BENCHMARK_METRICS.map((m) => m.id));
      expect(metricIds).toContain('prevented');
      expect(metricIds).toContain('prompted');
      expect(metricIds).toContain('allowed');
      expect(metricIds).toContain('detection_only');
      expect(metricIds).toContain('unsupported');
      expect(metricIds).toContain('false_positive');
      expect(metricIds).toContain('median_latency_ms');
      expect(metricIds).toContain('p95_latency_ms');
      expect(metricIds).toContain('setup_steps');
      expect(metricIds).toContain('setup_elapsed_s');
      expect(metricIds).toContain('network_required');
      expect(metricIds).toContain('data_leaving_machine');
      expect(metricIds).toContain('receipt_created');
    });

    it('defines the ordered risk taxonomy and exhaustive six-outcome rubric', () => {
      expect(BENCHMARK_RISK_CLASS_DEFINITIONS.map((definition) => definition.id)).toEqual([
        'secret_access',
        'risky_shell',
        'mcp_server_change',
        'tool_poisoning',
        'package_risk',
        'safe_control',
        'approval_control',
        'receipt_creation',
      ]);
      expect(Object.keys(BENCHMARK_OUTCOME_DEFINITIONS)).toEqual([
        'allowed',
        'prevented',
        'prompted',
        'detection_only',
        'unsupported',
        'false_positive',
      ]);
      expect(BENCHMARK_OUTCOME_DEFINITIONS.prompted.label).toBe('Approval required');
      expect(BENCHMARK_OUTCOME_DEFINITIONS.detection_only.label).toBe('Detected only');
      expect(JSON.stringify(BENCHMARK_OUTCOME_DEFINITIONS)).not.toContain('failed');
    });
  });

  describe('fixture benchmark run', () => {
    const run = runFixtureBenchmark();

    it('produces a run with correct schema version', () => {
      expect(run.schemaVersion).toBeTruthy();
      expect(run.runId).toBeTruthy();
    });

    it('has all required publication fields', () => {
      expect(run.author).toBeTruthy();
      expect(run.technicalReviewer).toBeTruthy();
      expect(run.testDate).toBeTruthy();
      expect(run.os).toBeTruthy();
      expect(run.versions).toBeTruthy();
      expect(Object.keys(run.versions).length).toBeGreaterThan(0);
      expect(run.hardware).toBeTruthy();
      expect(run.policyConfig).toBeTruthy();
      expect(run.sampleSize).toBeGreaterThan(0);
      expect(run.methodology).toBeTruthy();
      expect(run.limitations).toBeTruthy();
      expect(run.failures).toBeTruthy();
      expect(run.updateSchedule).toBeTruthy();
    });

    it('has results for every eligible harness × comparator × scenario', () => {
      const expectedCount =
        BENCHMARK_HARNESSES.filter((h) => h.eligible).length *
        BENCHMARK_COMPARATORS.length *
        BENCHMARK_SCENARIOS.length;
      expect(run.results.length).toBe(expectedCount);
    });

    it('does not make Guard win every criterion', () => {
      // Native default should allow risky actions (not prevent them)
      const nativeDefaultPrevented = run.results.filter(
        (r) => r.comparator === 'native_default' && r.outcome === 'prevented'
      );
      expect(nativeDefaultPrevented.length).toBe(0);

      // Native default should allow secret access (no protection)
      const nativeSecretResults = run.results.filter(
        (r) => r.comparator === 'native_default' && r.scenarioId === 'read_fixture_env'
      );
      expect(nativeSecretResults.length).toBeGreaterThan(0);
      expect(nativeSecretResults[0].outcome).toBe('allowed');
    });

    it('safe actions are never blocked (no false positives)', () => {
      const safeResults = run.results.filter((r) => r.scenarioId === 'run_known_safe_action');
      for (const r of safeResults) {
        expect(r.outcome).not.toBe('prevented');
        expect(r.outcome).not.toBe('false_positive');
      }
    });
  });

  describe('written finding invariants', () => {
    const run = runFixtureBenchmark();
    const riskyScenarioIds = new Set(
      BENCHMARK_SCENARIOS
        .filter((scenario) => !['safe_control', 'approval_control', 'receipt_creation'].includes(scenario.riskClass))
        .map((scenario) => scenario.id),
    );
    const outcomesFor = (comparator: (typeof BENCHMARK_COMPARATORS)[number]['id'], scenarioIds: ReadonlySet<string>) =>
      run.results.filter((result) => result.comparator === comparator && scenarioIds.has(result.scenarioId)).map((result) => result.outcome);

    it('matches the native default and strict findings', () => {
      expect(new Set(outcomesFor('native_default', riskyScenarioIds))).toEqual(new Set(['allowed']));
      expect(new Set(outcomesFor('native_strict', new Set(BENCHMARK_SCENARIOS.filter((scenario) => scenario.riskClass === 'secret_access').map((scenario) => scenario.id))))).toEqual(new Set(['detection_only']));
      expect(new Set(outcomesFor('native_strict', new Set(BENCHMARK_SCENARIOS.filter((scenario) => scenario.riskClass === 'risky_shell').map((scenario) => scenario.id))))).toEqual(new Set(['prompted']));
    });

    it('matches the Guard default and strict findings', () => {
      const guardedFixtureIds = new Set(BENCHMARK_SCENARIOS.filter((scenario) => ['secret_access', 'tool_poisoning', 'risky_shell'].includes(scenario.riskClass)).map((scenario) => scenario.id));
      expect(new Set(outcomesFor('guard_default', guardedFixtureIds))).toEqual(new Set(['prevented']));
      expect(new Set(outcomesFor('guard_strict', riskyScenarioIds))).toEqual(new Set(['prevented']));
    });

    it('keeps safe and receipt verification actions allowed for every comparator', () => {
      const safeFixtureIds = new Set(BENCHMARK_SCENARIOS.filter((scenario) => ['safe_control', 'receipt_creation'].includes(scenario.riskClass)).map((scenario) => scenario.id));
      expect(new Set(run.results.filter((result) => safeFixtureIds.has(result.scenarioId)).map((result) => result.outcome))).toEqual(new Set(['allowed']));
    });
  });

  describe('JSON and CSV export', () => {
    const run = runFixtureBenchmark();

    it('JSON and CSV contain the same result cardinality', () => {
      const json = exportJson(run);
      const csv = exportCsv(run);
      const parsedJson = JSON.parse(json) as BenchmarkRun;
      const csvLines = csv.trim().split('\n').length - 1; // minus header
      expect(parsedJson.results.length).toBe(csvLines);
      expect(parsedJson.results.length).toBe(run.results.length);
    });

    it('JSON is valid and parseable', () => {
      const json = exportJson(run);
      const parsed = JSON.parse(json) as BenchmarkRun;
      expect(parsed.schemaVersion).toBe(run.schemaVersion);
      expect(parsed.results.length).toBe(run.results.length);
    });

    it('CSV has correct headers', () => {
      const csv = exportCsv(run);
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('scenario_id');
      expect(headers).toContain('harness_id');
      expect(headers).toContain('comparator');
      expect(headers).toContain('outcome');
    });
  });

  describe('validation', () => {
    it('validation passes for a complete run', () => {
      const run = runFixtureBenchmark();
      expect(() => validateBenchmarkRun(run)).not.toThrow();
    });

    it('validation fails when author is missing', () => {
      const run = { ...runFixtureBenchmark(), author: '' };
      expect(() => validateBenchmarkRun(run)).toThrow(/author/i);
    });

    it('validation fails when methodology is missing', () => {
      const run = { ...runFixtureBenchmark(), methodology: '' };
      expect(() => validateBenchmarkRun(run)).toThrow(/methodology/i);
    });

    it('validation fails when limitations are missing', () => {
      const run = { ...runFixtureBenchmark(), limitations: '' };
      expect(() => validateBenchmarkRun(run)).toThrow(/limitations/i);
    });

    it('validation fails when versions are missing', () => {
      const run = { ...runFixtureBenchmark(), versions: {} };
      expect(() => validateBenchmarkRun(run)).toThrow(/versions/i);
    });

    it('validation fails when results are empty', () => {
      const run = { ...runFixtureBenchmark(), results: [] };
      expect(() => validateBenchmarkRun(run)).toThrow(/results/i);
    });
  });

  describe('deterministic reproduction', () => {
    it('runFixtureBenchmark is deterministic', () => {
      const run1 = runFixtureBenchmark();
      const run2 = runFixtureBenchmark();
      expect(run1.results.length).toBe(run2.results.length);
      expect(run1.runId).toBe(run2.runId);
      // Same outcomes for same scenarios
      for (let i = 0; i < run1.results.length; i++) {
        expect(run1.results[i].outcome).toBe(run2.results[i].outcome);
      }
    });
  });
});
