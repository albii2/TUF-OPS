import { FastifyInstance } from 'fastify';
import {
  postQuizAttemptHandler,
  getPhase1StatusHandler,
  postWalkthroughStepHandler,
  getPhase2StatusHandler,
  getSandboxOrgsHandler,
  createSandboxOrgHandler,
  updateSandboxOrgHandler,
  getSandboxContactsHandler,
  createSandboxContactHandler,
  getSandboxOppsHandler,
  createSandboxOppHandler,
  getSandboxActivitiesHandler,
  createSandboxActivityHandler,
  getSandboxSummaryHandler,
  createSalesExecutionHandler,
  getSalesExecutionsHandler,
  getLeadsHandler,
  postDedupScanHandler,
  postClaimLeadHandler,
  getClaimedLeadsHandler,
  getQualityChecksHandler,
  postRandomAuditHandler,
  getVerificationAuditsHandler,
  getGraduationStatusHandler,
  postDirectorApprovalHandler,
  postPromoteSandboxDataHandler,
} from './academy-v2.controller';

export async function academyV2Routes(server: FastifyInstance) {
  // ── Phase 1: Quizzes ──
  server.post('/quizzes', postQuizAttemptHandler);
  server.get('/phase1-status', getPhase1StatusHandler);

  // ── Phase 2: CRM Walkthrough ──
  server.post('/walkthrough', postWalkthroughStepHandler);
  server.get('/phase2-status', getPhase2StatusHandler);

  // ── Phase 3: Sandbox CRUD ──
  server.get('/sandbox/orgs', getSandboxOrgsHandler);
  server.post('/sandbox/orgs', createSandboxOrgHandler);
  server.put('/sandbox/orgs/:id', updateSandboxOrgHandler);
  server.get('/sandbox/contacts', getSandboxContactsHandler);
  server.post('/sandbox/contacts', createSandboxContactHandler);
  server.get('/sandbox/opportunities', getSandboxOppsHandler);
  server.post('/sandbox/opportunities', createSandboxOppHandler);
  server.get('/sandbox/activities', getSandboxActivitiesHandler);
  server.post('/sandbox/activities', createSandboxActivityHandler);
  server.get('/sandbox/summary', getSandboxSummaryHandler);

  // ── Phase 4: Sales Execution ──
  server.post('/sales-executions', createSalesExecutionHandler);
  server.get('/sales-executions', getSalesExecutionsHandler);

  // ── Lead Taxonomy ──
  server.get('/leads', getLeadsHandler);
  server.post('/leads/dedup-scan', postDedupScanHandler);
  server.post('/leads/claim', postClaimLeadHandler);
  server.get('/leads/claimed', getClaimedLeadsHandler);

  // ── Quality & Verification ──
  server.get('/quality-checks', getQualityChecksHandler);
  server.post('/verification/audit', postRandomAuditHandler);
  server.get('/verification/audits', getVerificationAuditsHandler);

  // ── Graduation ──
  server.get('/graduation-status', getGraduationStatusHandler);
  server.post('/graduation/director-approve', postDirectorApprovalHandler);
  server.post('/graduation/promote-data', postPromoteSandboxDataHandler);
}
