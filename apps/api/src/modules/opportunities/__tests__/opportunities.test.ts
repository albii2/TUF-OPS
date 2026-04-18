import { createOpportunity, getOpportunitiesByOrganization } from '../opportunities.service';
import { createOrganization } from '../../organizations/organizations.service';
import { pool } from '@packages/database';

describe('Opportunities Service - Integration Test', () => {
  let orgId: number;

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('TRUNCATE TABLE "organizations", "opportunities" RESTART IDENTITY CASCADE');

    // Create a dummy organization to associate opportunities with
    const org = await createOrganization({ name: 'Test Org for Opps', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
    orgId = Number(org.id);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should create an opportunity and associate it with an organization', async () => {
    const newOppData = { 
      name: 'New Test Opp', 
      organization_id: orgId, 
      status: 'open', 
      value: 1000.00, 
      created_by: 1, 
      updated_by: 1,
      deal_type: 'UNIFORM'
    };

    const createdOpp = await createOpportunity(newOppData);
    expect(createdOpp.id).toBeDefined();
    expect(createdOpp.organization_id).toBe(orgId);

    const opps = await getOpportunitiesByOrganization(String(orgId));
    expect(opps.length).toBe(1);
    expect(opps[0].name).toBe(newOppData.name);
  });
});
