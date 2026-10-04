/**
 * TUF Ops 2.0 — the single deliberate ACTIVATE MARKET path (Wave 1 spine).
 *
 * Governing principle:
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * `activateMarket` is the ONLY code path that inserts into `markets`. Importing
 * or creating an `organizations` row does NOT create a Market, and neither does
 * creating an opportunity, order or activity. A Market exists iff an activation
 * committed (ADR-001 §5, UNIVERSE_VS_MARKETS §5).
 *
 * One transaction does all of:
 *   1. validates the six required fields (stable reason codes),
 *   2. rejects a second activation of the same school (UNIQUE backstop),
 *   3. allocates `market_number` from `market_number_seq` (concurrency-safe),
 *   4. inserts the `markets` row in state IDENTIFIED with activated_at = now(),
 *   5. materialises the initial `market_tasks` row from next_action/due,
 *   6. writes one append-only `market_activities` ACTIVATION event.
 */

import type { Market } from '@tuf/shared';
import {
  ActivationError,
  type ActivateMarketDeps,
  type ActivateMarketInput,
  type ActivationActor,
  type ActivationReason,
  type ActivationResult,
  type DbClientLike,
} from './markets.interface.js';

/** Mirrors `MarketPriority` in packages/shared/src/types/market.ts (spec §2.1). */
const MARKET_PRIORITIES = ['TIER_1', 'TIER_2', 'TIER_3'] as const;

/** The Market Lifecycle entry state (spec §6). */
const MARKET_ENTRY_STATE = 'IDENTIFIED';

const ACTIVATION_SOURCE = 'ACTIVATION';

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return String(value);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function pgErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function pgErrorConstraint(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'constraint' in error) {
    const constraint = (error as { constraint?: unknown }).constraint;
    return typeof constraint === 'string' ? constraint : '';
  }
  return '';
}

function rowToMarket(row: Record<string, any>): Market {
  return {
    id: row.id,
    marketNumber: row.market_number,
    universeOrganizationId: row.universe_organization_id,
    ownerId: row.owner_id,
    priority: row.priority,
    objective: row.objective,
    nextAction: row.next_action,
    nextActionDue: toIso(row.next_action_due),
    state: row.state,
    activatedAt: toIso(row.activated_at),
    blocker: row.blocker ?? null,
    lastActivityAt: row.last_activity_at ? toIso(row.last_activity_at) : null,
    source: row.source ?? null,
    createdBy: row.created_by ?? null,
    updatedBy: row.updated_by ?? null,
    createdAt: row.created_at ? toIso(row.created_at) : null,
    updatedAt: row.updated_at ? toIso(row.updated_at) : null,
  } as Market;
}

/** Validated, normalised activation input used inside the transaction. */
interface ValidatedInput {
  universeOrganizationId: number;
  ownerId: number;
  priority: string;
  objective: string;
  nextAction: string;
  nextActionDue: Date;
}

/**
 * Field validation (V1–V4, V6, V7-presence, plus actor identity). Runs before
 * any write. Stable reason codes only — never a raw Postgres error.
 */
function validate(
  input: ActivateMarketInput,
  actor: ActivationActor,
): { value: ValidatedInput; warnings: ActivationReason[] } {
  const warnings: ActivationReason[] = [];

  const ownerId = toPositiveInt(input.ownerId);
  if (!ownerId) throw new ActivationError('MISSING_OWNER', 'ownerId is required');

  const objective = trimmed(input.objective);
  if (!objective) throw new ActivationError('MISSING_OBJECTIVE', 'objective is required');

  const nextAction = trimmed(input.nextAction);
  if (!nextAction) throw new ActivationError('MISSING_NEXT_ACTION', 'nextAction is required');

  const nextActionDue = toDate(input.nextActionDue);
  if (!nextActionDue) {
    throw new ActivationError('MISSING_NEXT_ACTION_DUE', 'nextActionDue must be a valid timestamp');
  }

  const universeOrganizationId = toPositiveInt(input.universeOrganizationId);
  if (!universeOrganizationId) {
    throw new ActivationError(
      'UNKNOWN_UNIVERSE_REFERENCE',
      'universeOrganizationId is required and must reference an organizations row',
    );
  }

  const priority = trimmed(input.priority).toUpperCase();
  if (!(MARKET_PRIORITIES as readonly string[]).includes(priority)) {
    throw new ActivationError('INVALID_PRIORITY', `priority must be one of ${MARKET_PRIORITIES.join(', ')}`);
  }

  if (!toPositiveInt(actor?.id)) {
    throw new ActivationError('NOT_AUTHORISED', 'an authenticated actor is required to activate a market');
  }

  // V5 is soft (spec §3.1): a past-due next action is a warning, never a block,
  // so a back-dated seed/commissioned market stays representable.
  if (nextActionDue.getTime() < Date.now()) warnings.push('MISSING_NEXT_ACTION_DUE');

  return {
    value: { universeOrganizationId, ownerId, priority, objective, nextAction, nextActionDue },
    warnings,
  };
}

async function resolveDb(deps: ActivateMarketDeps): Promise<{ connect(): Promise<DbClientLike> }> {
  if (deps.db) return deps.db;
  const mod = await import('@packages/database');
  return mod.pool as unknown as { connect(): Promise<DbClientLike> };
}

/**
 * ACTIVATE MARKET. Creates exactly one Market + its initial Task + one
 * ACTIVATION Activity, atomically. Throws `ActivationError` on every contract
 * violation. Returns the created Market (state = IDENTIFIED).
 */
export async function activateMarket(
  input: ActivateMarketInput,
  actor: ActivationActor,
  deps: ActivateMarketDeps = {},
): Promise<ActivationResult> {
  const { value, warnings } = validate(input, actor);
  const db = await resolveDb(deps);

  const maxAttempts = 2; // spec §4.1: losing a market_number race retries allocation once
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // V1 — owner must resolve to a live users row.
      const owner = await client.query<{ id: number }>('SELECT id FROM users WHERE id = $1', [
        value.ownerId,
      ]);
      if (owner.rows.length === 0) {
        throw new ActivationError('MISSING_OWNER', `no users row with id ${value.ownerId}`);
      }

      // V7 — the universe reference must resolve.
      const universe = await client.query<{ id: number }>(
        'SELECT id FROM organizations WHERE id = $1',
        [value.universeOrganizationId],
      );
      if (universe.rows.length === 0) {
        throw new ActivationError(
          'UNKNOWN_UNIVERSE_REFERENCE',
          `no organizations row with id ${value.universeOrganizationId}`,
        );
      }

      // V9 — one activation per school (explicit check; UNIQUE is the backstop).
      const existing = await client.query<{ id: number; market_number: number }>(
        'SELECT id, market_number FROM markets WHERE universe_organization_id = $1',
        [value.universeOrganizationId],
      );
      if (existing.rows.length > 0) {
        throw new ActivationError(
          'SCHOOL_ALREADY_ACTIVATED',
          `school ${value.universeOrganizationId} is already market ${existing.rows[0].market_number}`,
        );
      }

      // Allocate concurrency-safe market_number, then insert atomically.
      const seq = await client.query<{ market_number: number }>(
        "SELECT nextval('market_number_seq') AS market_number",
      );
      const marketNumber = Number(seq.rows[0].market_number);

      const inserted = await client.query<Record<string, any>>(
        `INSERT INTO markets (
           market_number, universe_organization_id, owner_id, priority, objective,
           next_action, next_action_due, state, activated_at, source, created_by, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, $10)
         RETURNING *`,
        [
          marketNumber,
          value.universeOrganizationId,
          value.ownerId,
          value.priority,
          value.objective,
          value.nextAction,
          value.nextActionDue.toISOString(),
          MARKET_ENTRY_STATE,
          ACTIVATION_SOURCE,
          value.ownerId,
        ],
      );
      const marketRow = inserted.rows[0];

      // Materialise the initial Task from next_action / next_action_due.
      await client.query(
        `INSERT INTO market_tasks (market_id, title, due_at, state, source, created_by)
         VALUES ($1, $2, $3, 'OPEN', $4, $5)`,
        [marketRow.id, value.nextAction, value.nextActionDue.toISOString(), ACTIVATION_SOURCE, value.ownerId],
      );

      // Append-only ACTIVATION activity — the deliberate commitment is logged.
      await client.query(
        `INSERT INTO market_activities (market_id, type, source, actor_id, detail)
         VALUES ($1, 'MARKET_ACTIVATED', $2, $3, $4)`,
        [marketRow.id, ACTIVATION_SOURCE, toPositiveInt(actor.id), value.objective],
      );

      await client.query('COMMIT');
      return { market: rowToMarket(marketRow), warnings };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* connection already unusable — surfaced by the original error */
      }

      if (error instanceof ActivationError) throw error;

      const code = pgErrorCode(error);
      const constraint = pgErrorConstraint(error);

      if (code === '23505') {
        if (constraint.includes('universe_organization_id')) {
          throw new ActivationError(
            'SCHOOL_ALREADY_ACTIVATED',
            `school ${value.universeOrganizationId} is already a Market`,
          );
        }
        // market_number collision → retry allocation once (spec §4.1).
        if (constraint.includes('market_number') && attempt < maxAttempts) continue;
        throw new ActivationError('DUPLICATE_MARKET_NUMBER', 'market_number allocation collided');
      }
      if (code === '23503') {
        throw new ActivationError('UNKNOWN_UNIVERSE_REFERENCE', 'universe reference does not exist');
      }
      if (code === '23502') {
        throw new ActivationError('MISSING_NEXT_ACTION', 'a required activation field was null');
      }
      throw error;
    } finally {
      client.release?.();
    }
  }

  // Unreachable: the loop either returns or throws.
  throw new ActivationError('DUPLICATE_MARKET_NUMBER', 'market_number allocation failed');
}
