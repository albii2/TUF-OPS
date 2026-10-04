/**
 * Runner entry point for the `packages/shared` tests.
 *
 *   npx tsx packages/shared/src/__tests__/run.ts
 *
 * (There is no jest/vitest setup resolvable from this package; the harness is
 * self-contained and dependency-free, keeping `@tuf/shared` pure.)
 *
 * This file is also typechecked by `tsc -p packages/shared/tsconfig.json`,
 * which includes `common-fields.type-test.ts` (the compile-time invariant
 * proof) as a side effect.
 */

import { runSuites } from './_harness.js';
import { plan23EnumTests } from './plan-2.3-enums.test.js';
import { stateMachineTests } from './state-machines.test.js';

runSuites([
  { name: 'plan-2.3-enums', cases: plan23EnumTests },
  { name: 'state-machines', cases: stateMachineTests },
]);
