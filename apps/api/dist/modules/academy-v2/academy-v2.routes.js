"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyV2Routes = academyV2Routes;
const auth_1 = require("../../auth");
const academy_v2_controller_1 = require("./academy-v2.controller");
async function academyV2Routes(server) {
    // ── Auth hook: verify user only accesses their own sandbox data ──
    server.addHook('onRequest', async (request, reply) => {
        // Skip auth for lead taxonomy (shared resource) and dedup scan
        const url = request.url;
        if (url.startsWith('/leads') && !url.startsWith('/leads/claimed'))
            return;
        await (0, auth_1.authMiddleware)(request);
        if (!request.currentUser) {
            return reply.code(401).send({ error: 'Authentication required' });
        }
        // Extract userId from query or body and verify it matches the authenticated user
        const queryUserId = request.query?.userId;
        const bodyUserId = request.body?.userId;
        const requestedUserId = queryUserId ? parseInt(queryUserId, 10) : bodyUserId ? parseInt(bodyUserId, 10) : null;
        // Directors and admins can view any user's academy data
        const directorRoles = ['DIRECTOR', 'REGIONAL_DIRECTOR', 'ADMIN'];
        if (requestedUserId && request.currentUser.id !== requestedUserId && !directorRoles.includes(request.currentUser.role)) {
            return reply.code(403).send({ error: 'You can only access your own academy data' });
        }
    });
    // ── Phase 1: Quizzes ──
    server.post('/quizzes', academy_v2_controller_1.postQuizAttemptHandler);
    server.get('/phase1-status', academy_v2_controller_1.getPhase1StatusHandler);
    // ── Phase 2: CRM Walkthrough ──
    server.post('/walkthrough', academy_v2_controller_1.postWalkthroughStepHandler);
    server.get('/phase2-status', academy_v2_controller_1.getPhase2StatusHandler);
    // ── Phase 3: Sandbox CRUD ──
    server.get('/sandbox/orgs', academy_v2_controller_1.getSandboxOrgsHandler);
    server.post('/sandbox/orgs', academy_v2_controller_1.createSandboxOrgHandler);
    server.put('/sandbox/orgs/:id', academy_v2_controller_1.updateSandboxOrgHandler);
    server.get('/sandbox/contacts', academy_v2_controller_1.getSandboxContactsHandler);
    server.post('/sandbox/contacts', academy_v2_controller_1.createSandboxContactHandler);
    server.get('/sandbox/opportunities', academy_v2_controller_1.getSandboxOppsHandler);
    server.post('/sandbox/opportunities', academy_v2_controller_1.createSandboxOppHandler);
    server.get('/sandbox/activities', academy_v2_controller_1.getSandboxActivitiesHandler);
    server.post('/sandbox/activities', academy_v2_controller_1.createSandboxActivityHandler);
    server.get('/sandbox/summary', academy_v2_controller_1.getSandboxSummaryHandler);
    // ── Phase 4: Sales Execution ──
    server.post('/sales-executions', academy_v2_controller_1.createSalesExecutionHandler);
    server.get('/sales-executions', academy_v2_controller_1.getSalesExecutionsHandler);
    // ── Lead Taxonomy ──
    server.get('/leads', academy_v2_controller_1.getLeadsHandler);
    server.post('/leads/dedup-scan', academy_v2_controller_1.postDedupScanHandler);
    server.post('/leads/claim', academy_v2_controller_1.postClaimLeadHandler);
    server.get('/leads/claimed', academy_v2_controller_1.getClaimedLeadsHandler);
    // ── Quality & Verification ──
    server.get('/quality-checks', academy_v2_controller_1.getQualityChecksHandler);
    server.post('/verification/audit', academy_v2_controller_1.postRandomAuditHandler);
    server.get('/verification/audits', academy_v2_controller_1.getVerificationAuditsHandler);
    // ── Graduation ──
    server.get('/graduation-status', academy_v2_controller_1.getGraduationStatusHandler);
    server.post('/graduation/director-approve', academy_v2_controller_1.postDirectorApprovalHandler);
    server.post('/graduation/promote-data', academy_v2_controller_1.postPromoteSandboxDataHandler);
}
//# sourceMappingURL=academy-v2.routes.js.map