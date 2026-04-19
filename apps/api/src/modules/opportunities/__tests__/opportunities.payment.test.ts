import { createOpportunity, updateOpportunityStage, confirmPayment, getOpportunityById } from '../opportunities.service';
import { createOrganization } from '../../organizations/organizations.service';
import { Opportunity, OpportunityStage } from '../opportunities.interface';
import { pool } from '@packages/database';

describe('Payment Confirmation Service Logic', () => {
    let org: any;
    let opp: Opportunity;

    beforeEach(async () => {
        await pool.query('TRUNCATE TABLE organizations, opportunities, commissions, opportunity_stage_history, activities RESTART IDENTITY CASCADE');
        org = await createOrganization({ name: 'Test Org for Payments', created_by: 1, updated_by: 1 });
        const oppData = {
            name: 'Test Opp for Payments',
            organization_id: org.id,
            value: 10000,
            status: 'open',
            stage: OpportunityStage.LEAD_ASSIGNED,
            deal_type: 'UNIFORM',
            assigned_rep_id: 1,
            assigned_director_id: 2,
            created_by: 1,
            updated_by: 1,
        };
        opp = await createOpportunity(oppData);

        // Move to INVOICE_SENT to set up the test scenario
        await updateOpportunityStage(opp.id, OpportunityStage.CONTACT_INITIATED, 1);
        await updateOpportunityStage(opp.id, OpportunityStage.MOCKUP_IN_PROGRESS, 1);
        await updateOpportunityStage(opp.id, OpportunityStage.MOCKUP_APPROVED, 1);
        await updateOpportunityStage(opp.id, OpportunityStage.INVOICE_SENT, 1);

        // Manually set financials AFTER stage progression to meet preconditions for confirmPayment.
        await pool.query(
            'UPDATE opportunities SET actual_revenue = $1, actual_cost = $2 WHERE id = $3',
            [10000, 5000, opp.id]
        );
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should confirm payment and move opportunity from INVOICE_SENT to CLOSED_WON', async () => {
        const updatedOpp = await confirmPayment(opp.id, { source: 'FINANCE_CONFIRMATION', confirmedByUserId: 1 });

        expect(updatedOpp.stage).toBe(OpportunityStage.CLOSED_WON);
        
        const finalOpp = await getOpportunityById(opp.id);
        expect(finalOpp.stage).toBe(OpportunityStage.CLOSED_WON);
        expect(finalOpp.payment_received_at).not.toBeNull();
    });

    it('should be idempotent and not create duplicate commissions', async () => {
        await confirmPayment(opp.id, { source: 'FINANCE_CONFIRMATION', confirmedByUserId: 1 });
        const commissionsAfterFirst = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opp.id]);
        expect(commissionsAfterFirst.rows.length).toBe(1);

        await confirmPayment(opp.id, { source: 'FINANCE_CONFIRMATION', confirmedByUserId: 1 });
        const commissionsAfterSecond = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opp.id]);
        expect(commissionsAfterSecond.rows.length).toBe(1);
    });

    it('should throw an error for an invalid stage (e.g., LEAD_ASSIGNED)', async () => {
        const freshOpp = await createOpportunity({ ...opp, id: 99, name: 'Fresh Opp', stage: OpportunityStage.LEAD_ASSIGNED });
        await expect(confirmPayment(freshOpp.id, { source: 'FINANCE_CONFIRMATION', confirmedByUserId: 1 }))
            .rejects.toThrow('Payment can only be confirmed for opportunities in INVOICE_SENT');
    });
});
