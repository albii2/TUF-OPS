import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { createActivity, getActivitiesByOpportunity, getActivitiesByOrganization, markActivityComplete, createRepActivity, getRepActivitiesByOpportunity } from '../activities.service';
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

// RepActivity (Prospecting Activity Log) Tests
describe('RepActivity Service — Prospecting Activity Log', () => {
  let userId: number;
  let opportunityId: number;
  let orgId: number;

  beforeAll(async () => {
    // Clean any test data from previous runs
    await pool.query('DELETE FROM rep_activities WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['repactivity-test%']);
    await pool.query('DELETE FROM opportunities WHERE name LIKE $1', ['%RepActivity%']);
    await pool.query('DELETE FROM organizations WHERE name LIKE $1', ['%RepActivity%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['repactivity-test%']);

    // Create a test user
    const userResult = await pool.query(
      `INSERT INTO users (email, credential_hash, role, name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['repactivity-test@example.com', 'hash123', 'REP', 'Test RepActivity User']
    );
    userId = userResult.rows[0].id;

    // Create a test organization
    const orgResult = await pool.query(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
      ['RepActivity Test Org']
    );
    orgId = orgResult.rows[0].id;

    // Create a test opportunity
    const oppResult = await pool.query(
      `INSERT INTO opportunities (name, organization_id, stage, value, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['RepActivity Test Opp', orgId, 'LEAD_ASSIGNED', 1000, userId, userId]
    );
    opportunityId = oppResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up only the data we created
    await pool.query('DELETE FROM rep_activities WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['repactivity-test%']);
    await pool.query('DELETE FROM opportunities WHERE name IN ($1, $2)', ['RepActivity Test Opp', 'No Activities Opp']);
    await pool.query('DELETE FROM organizations WHERE name = $1', ['RepActivity Test Org']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['repactivity-test%']);
  });

  it('should create a rep_activity of type call', async () => {
    const activity = await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'call',
      notes: 'Initial outreach call',
    });

    expect(activity.id).toBeDefined();
    expect(activity.user_id).toBe(userId);
    expect(activity.opportunity_id).toBe(opportunityId);
    expect(activity.activity_type).toBe('call');
    expect(activity.notes).toBe('Initial outreach call');
    expect(activity.user_full_name).toBe('Test RepActivity User');
    expect(activity.created_at).toBeDefined();
  });

  it('should create a rep_activity of type email', async () => {
    const activity = await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'email',
      notes: 'Sent proposal follow-up email',
    });

    expect(activity.activity_type).toBe('email');
    expect(activity.notes).toBe('Sent proposal follow-up email');
  });

  it('should create a rep_activity of type meeting', async () => {
    const activity = await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'meeting',
      notes: 'In-person meeting with AD',
    });

    expect(activity.activity_type).toBe('meeting');
  });

  it('should create a rep_activity of type note', async () => {
    const activity = await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'note',
      notes: 'Internal note about strategy',
    });

    expect(activity.activity_type).toBe('note');
  });

  it('should reject invalid activity_type', async () => {
    await expect(
      createRepActivity({
        user_id: userId,
        opportunity_id: opportunityId,
        activity_type: 'invalid_type',
        notes: 'Bad type',
      })
    ).rejects.toThrow('Invalid activity_type');
  });

  it('should reject missing opportunity_id', async () => {
    await expect(
      createRepActivity({
        user_id: userId,
        opportunity_id: 0 as any,
        activity_type: 'call',
        notes: 'Missing opp',
      })
    ).rejects.toThrow('opportunity_id is required');
  });

  it('should retrieve activities ordered by created_at DESC', async () => {
    // Create two activities
    await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'call',
      notes: 'First call (older)',
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 50));

    await createRepActivity({
      user_id: userId,
      opportunity_id: opportunityId,
      activity_type: 'meeting',
      notes: 'Latest meeting',
    });

    const activities = await getRepActivitiesByOpportunity(opportunityId);

    expect(activities.length).toBeGreaterThanOrEqual(2);
    // Most recent should be first
    expect(activities[0].activity_type).toBe('meeting');
    expect(activities[0].notes).toBe('Latest meeting');
    expect(new Date(activities[0].created_at).getTime())
      .toBeGreaterThanOrEqual(new Date(activities[activities.length - 1].created_at).getTime());
  });

  it('should return empty array for opportunity with no activities', async () => {
    // Create a new opportunity with no activities
    const oppResult = await pool.query(
      `INSERT INTO opportunities (name, organization_id, stage, value, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['No Activities Opp', orgId, 'LEAD_ASSIGNED', 500, userId, userId]
    );

    const activities = await getRepActivitiesByOpportunity(oppResult.rows[0].id);
    expect(activities).toEqual([]);
  });
});

// Top-level cleanup — end pool after all describe blocks
afterAll(async () => {
  await pool.end();
});
