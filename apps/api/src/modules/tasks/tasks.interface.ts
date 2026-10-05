/**
 * TUF Ops 2.0 — `tasks` module contract (Wave 5A).
 *
 * The Task engine is DETERMINISTIC and DATA-DRIVEN. A state transition resolves
 * the next task from an explicit, declarative lookup table (state -> template);
 * there is NO model/AI call anywhere in this module. The same (entity, state)
 * always yields the same task — see `tasks.lookup.ts` / `tasks.engine.ts`.
 *
 * Every task keys to a MARKET (`markets.id`), never to an organization.
 *
 * Reason codes are stable and machine-readable; the API surfaces these, never a
 * raw Postgres error.
 */

import type { MarketPriority } from '@tuf/shared';
import type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';

export type { MarketPriority };
export type { DbClientLike, DbPoolLike };

/** The entity kind whose lifecycle drives task generation. */
export type TaskEntityKind = 'MARKET' | 'LETTERED';

/** Stable, machine-readable task-engine rejection reasons. */
export type TaskEngineReason =
  | 'UNKNOWN_MARKET' // the market id does not resolve to a markets row
  | 'UNKNOWN_DEPLOYMENT' // the lettered deployment id does not resolve
  | 'ILLEGAL_TRANSITION' // the move violates the canonical state machine
  | 'UNKNOWN_STATE' // the target state is not in the declarative table
  | 'MISSING_ACTOR'; // an actor is required to generate a task

export const TASK_ENGINE_REASONS: readonly TaskEngineReason[] = [
  'UNKNOWN_MARKET',
  'UNKNOWN_DEPLOYMENT',
  'ILLEGAL_TRANSITION',
  'UNKNOWN_STATE',
  'MISSING_ACTOR',
];

/** Thrown by the task engine for every contract rejection. */
export class TaskEngineError extends Error {
  readonly reason: TaskEngineReason;

  constructor(reason: TaskEngineReason, message?: string) {
    super(message ?? reason);
    this.name = 'TaskEngineError';
    this.reason = reason;
  }
}

/** Thrown when a lifecycle move violates the canonical state machine. */
export class IllegalTransitionError extends Error {
  readonly from: string;
  readonly to: string;
  readonly reason = 'ILLEGAL_TRANSITION' as const;

  constructor(from: string, to: string) {
    super(`Illegal transition ${from} -> ${to}`);
    this.name = 'IllegalTransitionError';
    this.from = from;
    this.to = to;
  }
}

/**
 * A declarative task template: the promise that "being in state S means the next
 * move is `action`, due `dueInDays` from the transition, at `priority`".
 * A `null` template means the state generates NO task (terminal states).
 */
export interface TaskTemplate {
  /** Human-readable next action; becomes the task title AND `markets.next_action`. */
  action: string;
  /** Days from the transition instant until the task is due. */
  dueInDays: number;
  /** Task priority (carried from the template). */
  priority: MarketPriority;
}

/** The fully-resolved, deterministic next task for one transition. */
export interface NextTaskSpec {
  entity: TaskEntityKind;
  /** The state the entity moved INTO (the lookup key). */
  toState: string;
  /** Deterministic idempotency key, e.g. `MARKET:DEVELOPMENT`. */
  taskKey: string;
  title: string;
  dueAt: Date;
  priority: MarketPriority;
}

/** The deliberate actor (references `users.id`). */
export interface TaskActor {
  id?: number | string | null;
  role?: string | null;
}

export interface TaskEngineDeps {
  db?: DbPoolLike;
}

/** The outcome of an idempotent generation attempt. */
export interface GeneratedTask {
  taskId: number;
  taskKey: string;
  title: string;
  dueAt: string;
  priority: string;
  /** true when this call INSERTED the task; false when it already existed. */
  created: boolean;
}

/** A task row as the operational API returns it. */
export interface OperationalTask {
  id: number;
  marketId: number;
  taskKey: string | null;
  title: string;
  dueAt: string;
  state: string;
  priority: string | null;
  source: string | null;
  createdBy: number | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** The result of applying a Market transition. */
export interface MarketTransitionResult {
  marketId: number;
  marketNumber: number;
  fromState: string;
  toState: string;
  /** The generated task, or null when the target state generates none (KILLED). */
  task: GeneratedTask | null;
}

export interface ApplyMarketTransitionDeps {
  db?: DbPoolLike;
  /** Injectable clock for deterministic tests; defaults to `new Date()`. */
  now?: Date;
}
