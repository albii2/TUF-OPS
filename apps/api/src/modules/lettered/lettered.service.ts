/**
 * TUF Ops 2.0 — LETTERED write/transition service (Wave 3A).
 *
 * The lifecycle is validated against the CANONICAL state machine
 * (`@tuf/shared` → `packages/shared/src/state-machines/lettered.ts`). This
 * module NEVER re-implements the transition table: it delegates every legality
 * decision to `canTransitionLettered`. An illegal transition is REFUSED with a
 * typed `IllegalTransitionError` — never silently accepted, never coerced.
 *
 * LETTERED is NOT a RevenueOpportunity and is never routed through the generic
 * B2B opportunity lifecycle. A deployment is anchored to a MARKET.
 */

import {
  LetteredState,
  LETTERED_STATES,
  MARKET_PRIORITIES,
  canTransitionLettered,
} from '@tuf/shared';

import {
  IllegalTransitionError,
  LetteredDeploymentError,
  type CreateLetteredDeploymentInput,
  type CreateLetteredDeploymentDeps,
  type LetteredActor,
  type LetteredDeploymentReason,
} from './lettered.interface.js';
import {
  getLetteredDeploymentByIdOnClient,
  type OperationalLetteredDeployment,
} from './lettered.read.service.js';
import type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';

const LETTERED_STATE_SET = new Set<string>(LETTERED_STATES);
const PRIORITY_SET = new Set<string>(MARKET_PRIORITIES);

/** Resolve the shared pool lazily so the module has no hard `pg` import. */
async function resolveDb(deps: { db?: DbPoolLike }): Promise<DbPoolLike> {
  if (deps.db) return deps.db;
  const mod = await import('@packages/database');
  return mod.pool as unknown as DbPoolLike;
}

async function withClient<R>(db: DbPoolLike, fn: (client: DbClientLike) => Promise<R>): Promise<R> {
  if (typeof db.connect === 'function') {
    const client = await db.connect();
    try {
      return await fn(client);
    } finally {
      client.release?.();
    }
  }
  return fn(db as unknown as DbClientLike);
}

// --- small, explicit validators -------------------------------------------------

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function requireInt(
  value: unknown,
  reason: 'MISSING_OWNER',
  label: string,
): number {
  const n = toPositiveInt(value);
  if (n === null) throw new LetteredDeploymentError(reason, `${label} is required (a positive integer)`);
  return n;
}

function requireText(value: unknown, reason: LetteredDeploymentReason, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new LetteredDeploymentError(reason, `${label} is required (non-empty)`);
  }
  return value.trim();
}

function requirePriority(value: unknown): string {
  const v = typeof value === 'string' ? value : '';
  if (!PRIORITY_SET.has(v)) {
    throw new LetteredDeploymentError(
      'INVALID_PRIORITY',
      `priority must be one of ${MARKET_PRIORITIES.join(', ')}`,
    );
  }
  return v;
}

function requireState(value: unknown, fallback?: LetteredState): LetteredState {
  if (value === null || value === undefined) {
    if (fallback) return fallback;
    throw new LetteredDeploymentError('INVALID_STATE', 'state is required');
  }
  const v = String(value);
  if (!LETTERED_STATE_SET.has(v)) {
    throw new LetteredDeploymentError('INVALID_STATE', `'${v}' is not a canonical LETTERED state`);
  }
  return v as LetteredState;
}

function requireDue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    throw new LetteredDeploymentError('MISSING_NEXT_ACTION_DUE', 'nextActionDue is required');
  }
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    throw new LetteredDeploymentError('MISSING_NEXT_ACTION_DUE', 'nextActionDue is not a valid date');
  }
  return date.toISOString();
}

function actorId(actor: LetteredActor): number | null {
  const n = toPositiveInt(actor?.id);
  return n;
}

/**
 * Resolve the MARKET a deployment is anchored to. A universe-only organization
 * (one with no `markets` row) is REFUSED with `UNIVERSE_ONLY_ORGANIZATION` — it
 * has no operational existence.
 */
async function resolveMarket(
  client: DbClientLike,
  input: CreateLetteredDeploymentInput,
): Promise<{ marketId: number; marketNumber: number }> {
  const marketId = toPositiveInt(input.marketId);
  if (marketId !== null) {
    const found = await client.query<{ id: number; market_number: number }>(
      'SELECT id, market_number FROM markets WHERE id = $1 LIMIT 1',
      [marketId],
    );
    if (found.rows.length === 0) {
      throw new LetteredDeploymentError('UNKNOWN_MARKET', `no market with id ${marketId}`);
    }
    return { marketId: Number(found.rows[0].id), marketNumber: Number(found.rows[0].market_number) };
  }

  const orgId = toPositiveInt(input.universeOrganizationId);
  if (orgId !== null) {
    const found = await client.query<{ id: number; market_number: number }>(
      'SELECT id, market_number FROM markets WHERE universe_organization_id = $1 LIMIT 1',
      [orgId],
    );
    if (found.rows.length === 0) {
      throw new LetteredDeploymentError(
        'UNIVERSE_ONLY_ORGANIZATION',
        `organization ${orgId} is universe-only (no market) — a deployment cannot be created for it`,
      );
    }
    return { marketId: Number(found.rows[0].id), marketNumber: Number(found.rows[0].market_number) };
  }

  throw new LetteredDeploymentError(
    'MISSING_MARKET',
    'a deployment must reference a market (marketId or universeOrganizationId)',
  );
}

/**
 * Create a LETTERED deployment for a Market. Defaults to the canonical entry
 * state IDENTIFIED. A universe-only organization is refused (no market exists).
 */
export async function createLetteredDeployment(
  input: CreateLetteredDeploymentInput,
  actor: LetteredActor = {},
  deps: CreateLetteredDeploymentDeps = {},
): Promise<OperationalLetteredDeployment> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const market = await resolveMarket(client, input);

    const ownerId = requireInt(input.ownerId, 'MISSING_OWNER', 'ownerId');
    const objective = requireText(input.objective, 'MISSING_OBJECTIVE', 'objective');
    const nextAction = requireText(input.nextAction, 'MISSING_NEXT_ACTION', 'nextAction');
    const nextActionDue = requireDue(input.nextActionDue);
    const priority = requirePriority(input.priority);
    const state = requireState(input.state, LetteredState.IDENTIFIED);
    const by = actorId(actor);

    const inserted = await client.query<{ id: number }>(
      `INSERT INTO lettered_deployments (
         market_id, state, objective, owner_id, priority,
         next_action, next_action_due, blocker,
         drops_organization_id, drops_collection_id, drops_drop_id, storefront_url,
         source, created_by, updated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
       RETURNING id`,
      [
        market.marketId,
        state,
        objective,
        ownerId,
        priority,
        nextAction,
        nextActionDue,
        null, // blocker — unset at creation
        input.dropsOrganizationId ?? null,
        input.dropsCollectionId ?? null,
        input.dropsDropId ?? null,
        input.storefrontUrl ?? null,
        input.source ?? 'LETTERED_CREATE',
        by,
      ],
    );

    const id = Number(inserted.rows[0].id);
    const row = await getLetteredDeploymentByIdOnClient(client, id);
    if (!row) throw new LetteredDeploymentError('NOT_FOUND', `deployment ${id} not readable after insert`);
    return row;
  });
}

/**
 * Apply a lifecycle transition. Validates with the canonical LETTERED state
 * machine (`canTransitionLettered`) and REFUSES an illegal move with a typed
 * `IllegalTransitionError`. Deterministic: the same (from, to) always decides
 * the same way.
 */
export async function transitionLetteredDeployment(
  id: number,
  toState: string,
  actor: LetteredActor = {},
  deps: CreateLetteredDeploymentDeps = {},
): Promise<OperationalLetteredDeployment> {
  const deploymentId = toPositiveInt(id);
  if (deploymentId === null) {
    throw new LetteredDeploymentError('NOT_FOUND', 'a positive deployment id is required');
  }
  const target = requireState(toState);

  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const current = await client.query<{ state: string }>(
      'SELECT state FROM lettered_deployments WHERE id = $1 FOR UPDATE',
      [deploymentId],
    );
    if (current.rows.length === 0) {
      throw new LetteredDeploymentError('NOT_FOUND', `no deployment with id ${deploymentId}`);
    }

    const from = current.rows[0].state as LetteredState;
    if (!canTransitionLettered(from, target)) {
      // The canonical guard is the SOLE authority: refuse, do not mutate.
      throw new IllegalTransitionError(from, target);
    }

    const by = actorId(actor);
    await client.query(
      `UPDATE lettered_deployments
          SET state = $2,
              last_activity_at = now(),
              updated_at = now(),
              updated_by = $3
        WHERE id = $1`,
      [deploymentId, target, by],
    );

    const row = await getLetteredDeploymentByIdOnClient(client, deploymentId);
    if (!row) throw new LetteredDeploymentError('NOT_FOUND', `deployment ${deploymentId} vanished`);
    return row;
  });
}
