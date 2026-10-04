/**
 * Minimal, dependency-free test harness for `packages/shared`.
 *
 * `@tuf/shared` is a pure-TS package with `dependencies: {}`. The repo has no
 * jest/vitest setup resolvable from this package (no `@types/jest`), so these
 * tests use a self-contained harness and are executed with `tsx`:
 *
 *   npx tsx packages/shared/src/__tests__/run.ts
 *
 * `console` comes from the default DOM lib; no `@types/node` is required, so
 * the shared `tsc` project still typechecks these files.
 */

export interface TestCase {
  name: string;
  run: () => void;
}

export interface Suite {
  name: string;
  cases: readonly TestCase[];
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(
      `Assertion failed: ${message}\n    expected: ${e}\n    actual:   ${a}`,
    );
  }
}

export function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

/** Runs every case in every suite; throws once at the end if anything failed. */
export function runSuites(suites: readonly Suite[]): void {
  const failures: string[] = [];
  let total = 0;

  for (const suite of suites) {
    for (const testCase of suite.cases) {
      total += 1;
      try {
        testCase.run();
      } catch (error) {
        failures.push(`${suite.name} › ${testCase.name}: ${(error as Error).message}`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `TUF Ops shared tests: ${failures.length}/${total} FAILED\n  - ${failures.join('\n  - ')}`,
    );
  }

  console.log(`TUF Ops shared tests: ${total}/${total} passed`);
}
