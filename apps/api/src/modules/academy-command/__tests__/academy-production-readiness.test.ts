import { pool } from '@packages/database';
import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { OpportunityStage } from '../../opportunities/opportunities.interface';
import { getParticipants } from '../academy-command.service';
import { listResources } from '../../academy-resources/academy-resources.service';
import { enrollUserInTraining, markModuleStarted, markModuleCompleted, submitModuleAssessment, getEnrollmentWithProgress } from '../../training/training.service';
import { TrainingRole } from '../../training/training.interface';

const DUMMY_HASH = 'scrypt$16384$8$1$dummy$dummy';
const RUN = Date.now();

async function createTestUser(name: string, email: string): Promise<number> {
  const u = await pool.query(
    `INSERT INTO users (name, email, role, status, credential_hash) VALUES ($1, $2, 'REP', 'ACTIVE', $3) RETURNING id`,
    [name, `${RUN}.${email}`, DUMMY_HASH],
  );
  return u.rows[0].id;
}

describe('Academy Command — production-readiness regression (orders.created_by)', () => {
  let testUserId: number;
  let orgId: number;
  let oppId: number;

  beforeAll(async () => {
    testUserId = await createTestUser('Academy Test Rep', 'academy.test@tuf.test');

    // Org + opp chain owned by the test rep
    const org: any = await createOrganization({
      name: `Academy Test School ${RUN}`, assigned_rep_id: testUserId,
      created_by: testUserId, updated_by: testUserId,
    } as any);
    orgId = org.id;
    const opp: any = await createOpportunity({
      organization_id: org.id, name: 'Academy Test Opp', status: 'open', value: 2500,
      deal_type: 'UNIFORM', created_by: testUserId, updated_by: testUserId,
      stage: OpportunityStage.INVOICE_SENT, assigned_rep_id: testUserId,
    } as any);
    oppId = opp.id;

    // Move opp to CLOSED_WON — the service auto-creates the order in the same transaction
    await updateOpportunityStage(opp.id, OpportunityStage.CLOSED_WON, testUserId, 'closed for academy test', { actual_revenue: 2500, actual_cost: 1000 } as any);
  });

  it('getParticipants does not throw on the orders join (regression: orders.created_by did not exist)', async () => {
    const actor = { id: 9999, role: 'ADMIN' } as any;
    const participants = await getParticipants(actor);
    const me: any = participants.find((p: any) => p.userId === testUserId);
    expect(me).toBeDefined();
    expect(me.orders).toBeGreaterThanOrEqual(1);
  });

  it('orders are attributed via opportunities.created_by ownership', async () => {
    const actor = { id: 9999, role: 'ADMIN' } as any;
    const participants = await getParticipants(actor);
    const me: any = participants.find((p: any) => p.userId === testUserId);
    expect(me.orders).toBe(1);
  });
});

describe('Academy Resources', () => {
  it('seeded resources are listable (Sales Playbook, TAE Packet, Fall 2026 briefing present)', async () => {
    const resources = await listResources();
    const slugs = resources.map((r) => r.slug);
    expect(slugs).toContain('sales-playbook');
    expect(slugs).toContain('tae-packet');
    expect(slugs).toContain('current-sales-briefing');
    expect(slugs).toContain('welcome-letter');
  });
});

describe('Training certification flow (Learn → Quiz)', () => {
  let userId: number;
  let enrollmentId: number;
  let moduleId: number;

  beforeAll(async () => {
    userId = await createTestUser('Academy Flow Rep', 'academy.flow@tuf.test');
    const m = await pool.query(
      `SELECT id FROM training_modules WHERE role = 'REP' AND phase = 'LEVEL_1_OPERATOR' ORDER BY order_index ASC LIMIT 1`,
    );
    moduleId = m.rows[0]?.id;
  });

  it('enrolls a rep, tracks learning, and grades the quiz server-side', async () => {
    const enrollment: any = await enrollUserInTraining(userId, TrainingRole.REP);
    enrollmentId = enrollment.id;
    expect(enrollment.role).toBe('REP');
    expect(enrollment.status).toBe('ACTIVE');

    await markModuleStarted(enrollmentId, moduleId);
    await markModuleCompleted(enrollmentId, moduleId, 60);

    const withProgress: any = await getEnrollmentWithProgress(enrollmentId);
    expect(withProgress.completionMetrics.totalModules).toBeGreaterThan(0);
    expect(Array.isArray(withProgress.assessments)).toBe(true);

    // Server-graded assessment: wrong answer → fail, correct answer → pass
    const module: any = withProgress.modules.find((md: any) => md.id === moduleId);
    expect(Array.isArray(module.quiz_json) && module.quiz_json.length > 0).toBe(true);
    const q = module.quiz_json[0];
    const wrong = q.options.map((o: string) => (o === q.correctAnswer ? q.options.find((x: string) => x !== q.correctAnswer) : o));
    const failRes = await submitModuleAssessment(enrollmentId, moduleId, wrong);
    expect(failRes.passed).toBe(false);

    const passRes = await submitModuleAssessment(enrollmentId, moduleId, [q.correctAnswer]);
    expect(passRes.passed).toBe(true);
    expect(passRes.score).toBe(100);
  });
});

afterAll(async () => {
  await pool.query(`DELETE FROM organizations WHERE name LIKE 'Academy Test School ${RUN}%'`);
  await pool.query(`DELETE FROM users WHERE email LIKE '${RUN}.%'`);
  await pool.end();
});
