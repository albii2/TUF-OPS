import { serializeForRole } from '../../../auth';

describe('TUF-003: Operations Serialization', () => {
  const taeRole = 'tae';
  const operationsRole = 'operations';
  const adminRole = 'admin';
  const directorRole = 'director';

  const fullOpportunity = {
    id: 1,
    name: 'Test Opp',
    organization_id: 100,
    sport: 'FOOTBALL',
    season: 'FALL',
    year: 2026,
    status: 'open',
    value: 10000.00,
    stage: 'MOCKUP_STAGE',
    estimated_revenue: 15000.00,
    expected_close_date: new Date('2026-12-31'),
    last_activity_date: new Date(),
    deal_type: 'UNIFORM',
    channel_type: 'UNIFORM',
    created_by: 1,
    updated_by: 1,
    assigned_rep_id: 10,
    assigned_director_id: 20,
  };

  describe('serializeForRole — single object', () => {
    it('returns full data for TAE role', () => {
      const result = serializeForRole({ ...fullOpportunity }, taeRole) as Record<string, unknown>;
      expect(result.value).toBe(10000.00);
      expect(result.estimated_revenue).toBe(15000.00);
      expect(result.expected_close_date).toBeDefined();
    });

    it('returns full data for Director role', () => {
      const result = serializeForRole({ ...fullOpportunity }, directorRole) as Record<string, unknown>;
      expect(result.value).toBe(10000.00);
      expect(result.estimated_revenue).toBe(15000.00);
      expect(result.expected_close_date).toBeDefined();
    });

    it('returns full data for Admin role', () => {
      const result = serializeForRole({ ...fullOpportunity }, adminRole) as Record<string, unknown>;
      expect(result.value).toBe(10000.00);
      expect(result.estimated_revenue).toBe(15000.00);
      expect(result.expected_close_date).toBeDefined();
    });

    it('strips pricing/pipeline fields for Operations role', () => {
      const result = serializeForRole({ ...fullOpportunity }, operationsRole) as Record<string, unknown>;
      // Sales-sensitive fields must be absent
      expect(result.value).toBeUndefined();
      expect(result.estimated_revenue).toBeUndefined();
      expect(result.expected_close_date).toBeUndefined();
      // Fulfillment-relevant fields must be present
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Opp');
      expect(result.stage).toBe('MOCKUP_STAGE');
      expect(result.sport).toBe('FOOTBALL');
      expect(result.organization_id).toBe(100);
      expect(result.deal_type).toBe('UNIFORM');
      expect(result.channel_type).toBe('UNIFORM');
      expect(result.assigned_rep_id).toBe(10);
    });

    it('handles null/undefined roles gracefully', () => {
      const result = serializeForRole({ ...fullOpportunity }, null) as Record<string, unknown>;
      expect(result.value).toBe(10000.00);
      expect(result.estimated_revenue).toBe(15000.00);
    });

    it('does not mutate the original object', () => {
      const original = { ...fullOpportunity };
      serializeForRole(original, operationsRole);
      expect(original.value).toBe(10000.00);
      expect(original.estimated_revenue).toBe(15000.00);
    });
  });

  describe('serializeForRole — array', () => {
    const opportunities = [
      { ...fullOpportunity, id: 1, name: 'Opp 1' },
      { ...fullOpportunity, id: 2, name: 'Opp 2' },
    ];

    it('returns full data for TAE role', () => {
      const result = serializeForRole(opportunities, taeRole) as Record<string, unknown>[];
      expect(result[0].value).toBe(10000.00);
      expect(result[1].value).toBe(10000.00);
    });

    it('strips fields from all items for Operations role', () => {
      const result = serializeForRole(opportunities, operationsRole) as Record<string, unknown>[];
      expect(result[0].value).toBeUndefined();
      expect(result[0].estimated_revenue).toBeUndefined();
      expect(result[0].expected_close_date).toBeUndefined();
      expect(result[1].value).toBeUndefined();
      expect(result[1].estimated_revenue).toBeUndefined();
      expect(result[1].expected_close_date).toBeUndefined();
      // Fulfillment fields preserved
      expect(result[0].name).toBe('Opp 1');
      expect(result[1].name).toBe('Opp 2');
      expect(result[0].stage).toBe('MOCKUP_STAGE');
    });
  });

  describe('Operations excluded fields — acceptance criteria', () => {
    it('Operations cannot see deal value (value field)', () => {
      const result = serializeForRole({ ...fullOpportunity }, operationsRole) as Record<string, unknown>;
      expect(result.value).toBeUndefined();
    });

    it('Operations cannot see estimated revenue', () => {
      const result = serializeForRole({ ...fullOpportunity }, operationsRole) as Record<string, unknown>;
      expect(result.estimated_revenue).toBeUndefined();
    });

    it('Operations cannot see expected close date (pipeline data)', () => {
      const result = serializeForRole({ ...fullOpportunity }, operationsRole) as Record<string, unknown>;
      expect(result.expected_close_date).toBeUndefined();
    });

    it('Operations can still see fulfillment-relevant data', () => {
      const result = serializeForRole({ ...fullOpportunity }, operationsRole) as Record<string, unknown>;
      expect(result.stage).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.organization_id).toBeDefined();
      expect(result.sport).toBeDefined();
      expect(result.season).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });
});
