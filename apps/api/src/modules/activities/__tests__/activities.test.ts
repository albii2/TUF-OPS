import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { createActivity, getActivitiesByOpportunity, getActivitiesByOrganization, markActivityComplete } from '../activities.service';
import { pool } from '@packages/database';
import { ActivityType } from '../activities.interface';
import { OpportunityStage } from '../../opportunities/opportunities.interface';

describe('Activities Service - Integration Test', () => {
  let orgId: number;
  let opportunityId: number;

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('TRUNCATE TABLE "organizations", "opportunities", "activities" RESTART IDENTITY CASCADE');

    // Create a dummy organization
    const org = await createOrganization({ name: 'Test Org for Activities', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
    orgId = org.id;

    // Create an initial opportunity
    const newOppData = {
      name: 'Activity Test Opp',
      organization_id: orgId,
      status: 'open',
      value: 1000.00,
      created_by: 1,
      updated_by: 1,
      stage: OpportunityStage.LEAD_ASSIGNED,
      last_activity_date: new Date('2023-01-01T00:00:00.000Z'), // Set a fixed date for testing last_activity_date update
      deal_type: 'UNIFORM',
    };
    const createdOpp = await createOpportunity(newOppData);
    opportunityId = createdOpp.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should create an activity and link it to an organization', async () => {
    const newActivityData = {
      type: ActivityType.CALL,
      organization_id: orgId,
      description: 'Initial call to prospect',
      created_by: 1,
    };
    const createdActivity = await createActivity(newActivityData);
    expect(createdActivity.id).toBeDefined();
    expect(createdActivity.organization_id).toBe(orgId);
    expect(createdActivity.opportunity_id).toBeNull();
  });

  it('should create an activity and link it to an opportunity and organization', async () => {
    const newActivityData = {
      type: ActivityType.EMAIL,
      organization_id: orgId,
      opportunity_id: opportunityId,
      description: 'Sent follow-up email',
      created_by: 1,
    };
    const createdActivity = await createActivity(newActivityData);
    expect(createdActivity.id).toBeDefined();
    expect(createdActivity.organization_id).toBe(orgId);
    expect(createdActivity.opportunity_id).toBe(opportunityId);
  });

  it('should update opportunity.last_activity_date when an activity is created for it', async () => {
    const initialOpportunity = await pool.query('SELECT last_activity_date FROM opportunities WHERE id = $1', [opportunityId]);
    const oldLastActivityDate = initialOpportunity.rows[0].last_activity_date;

    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate time passing

    const newActivityData = {
      type: ActivityType.NOTE,
      organization_id: orgId,
      opportunity_id: opportunityId,
      description: 'Added a note to opportunity',
      created_by: 1,
    };
    await createActivity(newActivityData);

    const updatedOpportunity = await pool.query('SELECT last_activity_date FROM opportunities WHERE id = $1', [opportunityId]);
    const newLastActivityDate = updatedOpportunity.rows[0].last_activity_date;

    expect(newLastActivityDate.getTime()).toBeGreaterThan(oldLastActivityDate.getTime());
  });

  it('should retrieve activities by organization', async () => {
    await createActivity({ type: ActivityType.CALL, organization_id: orgId, description: 'Org Call 1', created_by: 1 });
    await createActivity({ type: ActivityType.EMAIL, organization_id: orgId, description: 'Org Email 1', created_by: 1 });

    const activities = await getActivitiesByOrganization(orgId);
    expect(activities.length).toBe(2);
    expect(activities[0].organization_id).toBe(orgId);
  });

  it('should retrieve activities by opportunity', async () => {
    await createActivity({ type: ActivityType.CALL, organization_id: orgId, opportunity_id: opportunityId, description: 'Opp Call 1', created_by: 1 });
    await createActivity({ type: ActivityType.EMAIL, organization_id: orgId, opportunity_id: opportunityId, description: 'Opp Email 1', created_by: 1 });

    const activities = await getActivitiesByOpportunity(opportunityId);
    expect(activities.length).toBe(2);
    expect(activities[0].opportunity_id).toBe(opportunityId);
  });

  it('should mark an activity as complete', async () => {
    const newActivityData = {
      type: ActivityType.TASK,
      organization_id: orgId,
      description: 'Follow up with client',
      created_by: 1,
      due_date: new Date(),
    };
    const createdActivity = await createActivity(newActivityData);
    expect(createdActivity.completed).toBe(false);

    const completedActivity = await markActivityComplete(createdActivity.id, 1);
    expect(completedActivity.completed).toBe(true);

    const fetchedActivity = (await getActivitiesByOrganization(orgId)).find(act => act.id === createdActivity.id);
    expect(fetchedActivity?.completed).toBe(true);
  });

  it('should throw an error if activity to complete is not found', async () => {
    await expect(markActivityComplete(9999, 1)).rejects.toThrow('Activity not found');
  });
});
