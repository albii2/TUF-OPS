"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const organizations_service_1 = require("../../organizations/organizations.service");
const opportunities_service_1 = require("../../opportunities/opportunities.service");
const activities_service_1 = require("../activities.service");
const database_1 = require("@packages/database");
const activities_interface_1 = require("../activities.interface");
const opportunities_interface_1 = require("../../opportunities/opportunities.interface");
describe('Activities Service - Integration Test', () => {
    let orgId;
    let opportunityId;
    beforeEach(async () => {
        // Clean tables before each test
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities", "activities" RESTART IDENTITY CASCADE');
        // Create a dummy organization
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org for Activities', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
        orgId = org.id;
        // Create an initial opportunity
        const newOppData = {
            name: 'Activity Test Opp',
            organization_id: orgId,
            status: 'open',
            value: 1000.00,
            created_by: 1,
            updated_by: 1,
            stage: opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED,
            last_activity_date: new Date('2023-01-01T00:00:00.000Z'), // Set a fixed date for testing last_activity_date update
            deal_type: 'UNIFORM',
        };
        const createdOpp = await (0, opportunities_service_1.createOpportunity)(newOppData);
        opportunityId = createdOpp.id;
    });
    afterAll(async () => {
        await database_1.pool.end();
    });
    it('should create an activity and link it to an organization', async () => {
        const newActivityData = {
            type: activities_interface_1.ActivityType.CALL,
            organization_id: orgId,
            description: 'Initial call to prospect',
            created_by: 1,
        };
        const createdActivity = await (0, activities_service_1.createActivity)(newActivityData);
        expect(createdActivity.id).toBeDefined();
        expect(createdActivity.organization_id).toBe(orgId);
        expect(createdActivity.opportunity_id).toBeNull();
    });
    it('should create an activity and link it to an opportunity and organization', async () => {
        const newActivityData = {
            type: activities_interface_1.ActivityType.EMAIL,
            organization_id: orgId,
            opportunity_id: opportunityId,
            description: 'Sent follow-up email',
            created_by: 1,
        };
        const createdActivity = await (0, activities_service_1.createActivity)(newActivityData);
        expect(createdActivity.id).toBeDefined();
        expect(createdActivity.organization_id).toBe(orgId);
        expect(createdActivity.opportunity_id).toBe(opportunityId);
    });
    it('should update opportunity.last_activity_date when an activity is created for it', async () => {
        const initialOpportunity = await database_1.pool.query('SELECT last_activity_date FROM opportunities WHERE id = $1', [opportunityId]);
        const oldLastActivityDate = initialOpportunity.rows[0].last_activity_date;
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate time passing
        const newActivityData = {
            type: activities_interface_1.ActivityType.NOTE,
            organization_id: orgId,
            opportunity_id: opportunityId,
            description: 'Added a note to opportunity',
            created_by: 1,
        };
        await (0, activities_service_1.createActivity)(newActivityData);
        const updatedOpportunity = await database_1.pool.query('SELECT last_activity_date FROM opportunities WHERE id = $1', [opportunityId]);
        const newLastActivityDate = updatedOpportunity.rows[0].last_activity_date;
        expect(newLastActivityDate.getTime()).toBeGreaterThan(oldLastActivityDate.getTime());
    });
    it('should retrieve activities by organization', async () => {
        await (0, activities_service_1.createActivity)({ type: activities_interface_1.ActivityType.CALL, organization_id: orgId, description: 'Org Call 1', created_by: 1 });
        await (0, activities_service_1.createActivity)({ type: activities_interface_1.ActivityType.EMAIL, organization_id: orgId, description: 'Org Email 1', created_by: 1 });
        const activities = await (0, activities_service_1.getActivitiesByOrganization)(orgId);
        expect(activities.length).toBe(2);
        expect(activities[0].organization_id).toBe(orgId);
    });
    it('should retrieve activities by opportunity', async () => {
        await (0, activities_service_1.createActivity)({ type: activities_interface_1.ActivityType.CALL, organization_id: orgId, opportunity_id: opportunityId, description: 'Opp Call 1', created_by: 1 });
        await (0, activities_service_1.createActivity)({ type: activities_interface_1.ActivityType.EMAIL, organization_id: orgId, opportunity_id: opportunityId, description: 'Opp Email 1', created_by: 1 });
        const activities = await (0, activities_service_1.getActivitiesByOpportunity)(opportunityId);
        expect(activities.length).toBe(2);
        expect(activities[0].opportunity_id).toBe(opportunityId);
    });
    it('should mark an activity as complete', async () => {
        const newActivityData = {
            type: activities_interface_1.ActivityType.TASK,
            organization_id: orgId,
            description: 'Follow up with client',
            created_by: 1,
            due_date: new Date(),
        };
        const createdActivity = await (0, activities_service_1.createActivity)(newActivityData);
        expect(createdActivity.completed).toBe(false);
        const completedActivity = await (0, activities_service_1.markActivityComplete)(createdActivity.id, 1);
        expect(completedActivity.completed).toBe(true);
        const fetchedActivity = (await (0, activities_service_1.getActivitiesByOrganization)(orgId)).find(act => act.id === createdActivity.id);
        expect(fetchedActivity?.completed).toBe(true);
    });
    it('should throw an error if activity to complete is not found', async () => {
        await expect((0, activities_service_1.markActivityComplete)(9999, 1)).rejects.toThrow('Activity not found');
    });
});
//# sourceMappingURL=activities.test.js.map