/**
 * LETTERED deployment service — normalisation + the honest failure path.
 *
 * Proves the Wave 3B contract: a missing or failing LETTERED endpoint resolves
 * to `{ ok: false }` (the "not yet available" state) and NEVER throws or
 * fabricates a deployment.
 */
jest.mock('../services/apiClient', () => ({ apiClient: jest.fn() }));

import { apiClient } from '../services/apiClient';
import {
  deploymentFromPayload,
  getLetteredDeploymentForMarket,
  normalizeLetteredDeployment,
} from '../services/letteredService';

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => {
  mockApiClient.mockReset();
});

describe('normalizeLetteredDeployment', () => {
  it('accepts a snake_case deployment row', () => {
    const record = normalizeLetteredDeployment({
      id: 9,
      market_id: 1,
      market_number: 1,
      state: 'LIVE',
      objective: 'sell jerseys',
      next_action: 'publish drop',
      next_action_due: '2026-10-08T00:00:00.000Z',
      blocker: null,
      drops_organization_id: 'org-1',
      drops_collection_id: 'col-1',
      store_url: '/schools/pillager/drop-001',
    });
    expect(record).not.toBeNull();
    expect(record?.state).toBe('LIVE');
    expect(record?.nextAction).toBe('publish drop');
    expect(record?.dropsCollectionId).toBe('col-1');
    expect(record?.storefrontUrl).toBe('/schools/pillager/drop-001');
  });

  it('accepts a camelCase deployment row', () => {
    const record = normalizeLetteredDeployment({ id: 9, state: 'STORE_DRAFT', nextAction: 'build assets' });
    expect(record?.state).toBe('STORE_DRAFT');
    expect(record?.nextAction).toBe('build assets');
  });

  it('returns null when there is no canonical state (nothing honest to render)', () => {
    expect(normalizeLetteredDeployment({ id: 4, objective: 'x' })).toBeNull();
    expect(normalizeLetteredDeployment(null)).toBeNull();
    expect(normalizeLetteredDeployment('nope')).toBeNull();
  });
});

describe('deploymentFromPayload', () => {
  it('unwraps an envelope', () => {
    const record = deploymentFromPayload({ deployment: { id: 1, state: 'COMMERCE_QA' } });
    expect(record?.state).toBe('COMMERCE_QA');
  });

  it('accepts a bare object', () => {
    const record = deploymentFromPayload({ id: 1, state: 'LAUNCH_READY' });
    expect(record?.state).toBe('LAUNCH_READY');
  });

  it('returns null for an explicit null envelope or an empty payload', () => {
    expect(deploymentFromPayload({ deployment: null })).toBeNull();
    expect(deploymentFromPayload({})).toBeNull();
    expect(deploymentFromPayload(null)).toBeNull();
  });
});

describe('getLetteredDeploymentForMarket — defensive against a not-yet-built endpoint', () => {
  it('returns the deployment when the endpoint answers', async () => {
    mockApiClient.mockResolvedValueOnce({ deployment: { id: 1, state: 'LIVE', next_action: 'x' } });
    const result = await getLetteredDeploymentForMarket(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.deployment?.state).toBe('LIVE');
  });

  it('returns ok:true with deployment:null when no deployment is linked yet', async () => {
    mockApiClient.mockResolvedValueOnce({ deployment: null });
    const result = await getLetteredDeploymentForMarket(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.deployment).toBeNull();
  });

  it('NEVER throws on a failing/missing endpoint — resolves to ok:false', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('API request failed: 404'));
    const result = await getLetteredDeploymentForMarket(2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/404/);
  });

  it('handles a non-Error rejection honestly', async () => {
    mockApiClient.mockRejectedValueOnce('boom');
    const result = await getLetteredDeploymentForMarket(3);
    expect(result.ok).toBe(false);
  });
});
