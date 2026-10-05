/**
 * COMMAND task/obligation service + hook — normalisation and the honest
 * failure / empty paths (Wave 5B).
 *
 * Proves the Wave 5B contract:
 *   - a snake_case OR camelCase row normalises, flat or nested;
 *   - a record without a positive `marketNumber` is a universe organization,
 *     NOT a Market, and is dropped (rule (e));
 *   - an absent `next_action` is preserved as null, never invented;
 *   - a missing / failing endpoint resolves to `ok:false` (the honest
 *     "not yet available" state) and NEVER throws (rule (c));
 *   - an endpoint that answers with nothing is an empty queue, never a fake
 *     zero or a placeholder row (rule (d));
 *   - the `useCommandQueue` hook surfaces the same honest outcomes.
 */
jest.mock('../services/apiClient', () => ({ apiClient: jest.fn() }));

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { apiClient } from '../services/apiClient';
import {
  getCommandQueue,
  normalizeCommandObligation,
  obligationsFromPayload,
} from '../services/commandService';
import { useCommandQueue, type CommandQueueQuery } from '../hooks/useCommandQueue';

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  mockApiClient.mockReset();
});

describe('normalizeCommandObligation', () => {
  it('accepts a snake_case obligation row and maps all six fields', () => {
    const record = normalizeCommandObligation({
      task_id: 9,
      market_number: 1,
      market_id: 10,
      school_name: 'Pillager High School',
      state: 'LETTERED_LIVE',
      objective: 'Sell the fall drop',
      owner_name: 'Keith',
      next_action: 'Publish the storefront',
      next_action_due: '2026-10-09T12:00:00.000Z',
      blocker: 'Awaiting rights clearance',
      priority: 'TIER_1',
    });
    expect(record).not.toBeNull();
    expect(record?.marketNumber).toBe(1);
    expect(record?.schoolName).toBe('Pillager High School');
    expect(record?.state).toBe('LETTERED_LIVE');
    expect(record?.objective).toBe('Sell the fall drop');
    expect(record?.ownerName).toBe('Keith');
    expect(record?.nextAction).toBe('Publish the storefront');
    expect(record?.nextActionDue).toBe('2026-10-09T12:00:00.000Z');
    expect(record?.blocker).toBe('Awaiting rights clearance');
    expect(record?.taskId).toBe(9);
    expect(record?.priority).toBe('TIER_1');
  });

  it('accepts a camelCase obligation row', () => {
    const record = normalizeCommandObligation({
      marketNumber: 2,
      state: 'DEVELOPMENT',
      nextAction: 'Confirm launch date',
      nextActionDue: '2026-11-01T00:00:00.000Z',
    });
    expect(record?.marketNumber).toBe(2);
    expect(record?.nextAction).toBe('Confirm launch date');
  });

  it('accepts a nested task object and a nested market object', () => {
    const record = normalizeCommandObligation({
      market: { market_number: 3, school_name: 'Brainerd High School' },
      task: { state: 'IDENTIFIED', objective: 'Start outreach', next_action: 'Call AD', next_action_due: '2026-10-20T00:00:00.000Z' },
    });
    expect(record?.marketNumber).toBe(3);
    expect(record?.schoolName).toBe('Brainerd High School');
    expect(record?.state).toBe('IDENTIFIED');
    expect(record?.objective).toBe('Start outreach');
    expect(record?.nextAction).toBe('Call AD');
  });

  it('accepts deadline-style aliases for the due date', () => {
    expect(normalizeCommandObligation({ market_number: 1, deadline: '2026-10-09T12:00:00.000Z' })?.nextActionDue).toBe(
      '2026-10-09T12:00:00.000Z',
    );
    expect(normalizeCommandObligation({ market_number: 1, due_at: '2026-10-10T12:00:00.000Z' })?.nextActionDue).toBe(
      '2026-10-10T12:00:00.000Z',
    );
  });

  it('preserves an absent next_action as null — it is NEVER invented', () => {
    const record = normalizeCommandObligation({ market_number: 1, state: 'BLOCKED' });
    expect(record).not.toBeNull();
    expect(record?.nextAction).toBeNull();
    expect(record?.nextActionDue).toBe('');
    expect(record?.objective).toBeNull();
    expect(record?.ownerName).toBeNull();
  });

  it('(e) never normalises a universe-only record (no marketNumber) into a Market', () => {
    expect(normalizeCommandObligation({ name: 'Universe Only Academy', state: 'MN' })).toBeNull();
    expect(normalizeCommandObligation({ market_number: 0 })).toBeNull();
    expect(normalizeCommandObligation({ market_number: -2 })).toBeNull();
    expect(normalizeCommandObligation({ marketNumber: 'abc' })).toBeNull();
    expect(normalizeCommandObligation({})).toBeNull();
    expect(normalizeCommandObligation(null)).toBeNull();
    expect(normalizeCommandObligation('nope')).toBeNull();
    expect(normalizeCommandObligation([])).toBeNull();
  });
});

describe('obligationsFromPayload', () => {
  it('accepts a bare array', () => {
    expect(obligationsFromPayload([{ market_number: 1 }])).toHaveLength(1);
  });

  it('unwraps common envelopes', () => {
    expect(obligationsFromPayload({ tasks: [{ market_number: 1 }] })).toHaveLength(1);
    expect(obligationsFromPayload({ obligations: [{ market_number: 1 }] })).toHaveLength(1);
    expect(obligationsFromPayload({ command: [{ market_number: 1 }] })).toHaveLength(1);
    expect(obligationsFromPayload({ data: { tasks: [{ market_number: 1 }] } })).toHaveLength(1);
  });

  it('returns an empty array for an absent list — never a placeholder', () => {
    expect(obligationsFromPayload({})).toEqual([]);
    expect(obligationsFromPayload(null)).toEqual([]);
    expect(obligationsFromPayload('nope')).toEqual([]);
    expect(obligationsFromPayload({ tasks: null })).toEqual([]);
  });
});

describe('getCommandQueue — defensive against a not-yet-built endpoint', () => {
  it('(a) returns sorted-ready obligations when the endpoint answers', async () => {
    mockApiClient.mockResolvedValueOnce({
      tasks: [
        {
          market_number: 1,
          state: 'LIVE',
          next_action: 'Publish storefront',
          next_action_due: '2026-10-09T12:00:00.000Z',
        },
      ],
    });
    const result = await getCommandQueue();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.obligations).toHaveLength(1);
      expect(result.obligations[0].marketNumber).toBe(1);
    }
  });

  it('(d) returns ok:true with an empty array when the endpoint genuinely has nothing', async () => {
    mockApiClient.mockResolvedValueOnce({ tasks: [] });
    const result = await getCommandQueue();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.obligations).toEqual([]);
  });

  it('drops a leaked universe row while keeping the real Markets', async () => {
    mockApiClient.mockResolvedValueOnce({
      tasks: [{ name: 'Universe Only Academy' }, { market_number: 2, next_action: 'x' }],
    });
    const result = await getCommandQueue();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.obligations).toHaveLength(1);
      expect(result.obligations[0].marketNumber).toBe(2);
    }
  });

  it('(c) NEVER throws on a failing/missing endpoint — resolves to ok:false', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('API request failed: 404'));
    const result = await getCommandQueue();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/404/);
  });

  it('handles a non-Error rejection honestly', async () => {
    mockApiClient.mockRejectedValueOnce('boom');
    const result = await getCommandQueue();
    expect(result.ok).toBe(false);
  });
});

describe('useCommandQueue — the hook surfaces the honest outcomes', () => {
  function mountHook() {
    const seen: CommandQueueQuery[] = [];
    function Probe() {
      seen.push(useCommandQueue());
      return null;
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    return {
      seen,
      render: () => act(async () => root.render(createElement(Probe))),
      unmount: () => act(async () => root.unmount()),
      latest: () => seen[seen.length - 1],
    };
  }

  it('(c) resolves a failing endpoint to ok:false without throwing', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('API request failed: 404'));
    const hook = mountHook();
    await hook.render();

    const latest = hook.latest();
    expect(latest.loading).toBe(false);
    expect(latest.lookup?.ok).toBe(false);
    await hook.unmount();
  });

  it('loads a real, normalised queue when the endpoint answers', async () => {
    mockApiClient.mockResolvedValueOnce({
      tasks: [{ market_number: 1, state: 'LIVE', next_action: 'Publish', next_action_due: '2026-10-09T12:00:00.000Z' }],
    });
    const hook = mountHook();
    await hook.render();

    const latest = hook.latest();
    expect(latest.loading).toBe(false);
    expect(latest.lookup?.ok).toBe(true);
    if (latest.lookup?.ok) expect(latest.lookup.obligations[0].marketNumber).toBe(1);
    await hook.unmount();
  });

  it('(d) surfaces an honest empty queue (no fabricated row, no zero)', async () => {
    mockApiClient.mockResolvedValueOnce({ tasks: [] });
    const hook = mountHook();
    await hook.render();

    const latest = hook.latest();
    expect(latest.loading).toBe(false);
    expect(latest.lookup).toEqual({ ok: true, obligations: [] });
    await hook.unmount();
  });
});
