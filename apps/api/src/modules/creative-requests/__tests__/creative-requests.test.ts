import { pool } from '@packages/database';
import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity } from '../../opportunities/opportunities.service';
import { createCreativeRequest, listCreativeRequestsByOpportunity } from '../creative-requests.service';

describe('Creative Requests Service', () => {
  let opportunityId: number;
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE "creative_requests", "opportunities", "organizations" RESTART IDENTITY CASCADE');
    const org = await createOrganization({ name: 'CR Org', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 1, updated_by: 1 });
    const opp = await createOpportunity({ name: 'CR Opp', organization_id: Number(org.id), status: 'open', value: 1000, created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
    opportunityId = Number(opp.id);
  });

  afterAll(async () => { await pool.end(); });

  it('creates and fetches creative requests by opportunity', async () => {
    const created = await createCreativeRequest(opportunityId, { created_by_user_id: 1, request_type: 'MOCKUP', design_team: 'APPAREL_MOCKUP', priority: 'HIGH', title: 'Home/Away Mockups', design_notes: 'Need two concepts', needed_items: ['Home Uniform', 'Away Uniform'] });
    expect(created.id).toBeDefined();
    expect(created.status).toBe('SUBMITTED');
    const list = await listCreativeRequestsByOpportunity(opportunityId);
    expect(list.length).toBe(1);
  });

  it('validates required fields', async () => {
    await expect(createCreativeRequest(opportunityId, { created_by_user_id: 1, request_type: 'MOCKUP', design_team: 'APPAREL_MOCKUP', title: '', design_notes: '' } as any)).rejects.toThrow('Missing required fields');
  });
});
