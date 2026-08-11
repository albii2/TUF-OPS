"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postQuizAttemptHandler = postQuizAttemptHandler;
exports.getPhase1StatusHandler = getPhase1StatusHandler;
exports.postWalkthroughStepHandler = postWalkthroughStepHandler;
exports.getPhase2StatusHandler = getPhase2StatusHandler;
exports.getSandboxOrgsHandler = getSandboxOrgsHandler;
exports.createSandboxOrgHandler = createSandboxOrgHandler;
exports.updateSandboxOrgHandler = updateSandboxOrgHandler;
exports.getSandboxContactsHandler = getSandboxContactsHandler;
exports.createSandboxContactHandler = createSandboxContactHandler;
exports.getSandboxOppsHandler = getSandboxOppsHandler;
exports.createSandboxOppHandler = createSandboxOppHandler;
exports.getSandboxActivitiesHandler = getSandboxActivitiesHandler;
exports.createSandboxActivityHandler = createSandboxActivityHandler;
exports.getSandboxSummaryHandler = getSandboxSummaryHandler;
exports.createSalesExecutionHandler = createSalesExecutionHandler;
exports.getSalesExecutionsHandler = getSalesExecutionsHandler;
exports.getLeadsHandler = getLeadsHandler;
exports.postDedupScanHandler = postDedupScanHandler;
exports.postClaimLeadHandler = postClaimLeadHandler;
exports.getClaimedLeadsHandler = getClaimedLeadsHandler;
exports.getQualityChecksHandler = getQualityChecksHandler;
exports.postRandomAuditHandler = postRandomAuditHandler;
exports.getVerificationAuditsHandler = getVerificationAuditsHandler;
exports.getGraduationStatusHandler = getGraduationStatusHandler;
exports.postDirectorApprovalHandler = postDirectorApprovalHandler;
exports.postPromoteSandboxDataHandler = postPromoteSandboxDataHandler;
const academy_v2_service_1 = require("./academy-v2.service");
// ═══════════════════════════════════════════════════════════════════
// Phase 1 — Quizzes
// ═══════════════════════════════════════════════════════════════════
async function postQuizAttemptHandler(request, reply) {
    try {
        const { userId, quizId, score, passed, answers } = request.body;
        if (!userId || !quizId || score === undefined || passed === undefined) {
            return reply.code(400).send({ message: 'userId, quizId, score, and passed are required' });
        }
        const result = await (0, academy_v2_service_1.recordQuizAttempt)(Number(userId), quizId, Number(score), !!passed, answers || []);
        return reply.code(201).send(result);
    }
    catch (error) {
        console.error('[academy-v3:postQuiz]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getPhase1StatusHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const status = await (0, academy_v2_service_1.getPhase1Status)(Number(userId));
        return reply.send(status);
    }
    catch (error) {
        console.error('[academy-v3:phase1Status]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Phase 2 — CRM Walkthrough
// ═══════════════════════════════════════════════════════════════════
async function postWalkthroughStepHandler(request, reply) {
    try {
        const { userId, stepId } = request.body;
        if (!userId || !stepId) {
            return reply.code(400).send({ message: 'userId and stepId are required' });
        }
        const result = await (0, academy_v2_service_1.completeWalkthroughStep)(Number(userId), stepId);
        return reply.code(201).send(result);
    }
    catch (error) {
        console.error('[academy-v3:walkthrough]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getPhase2StatusHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const status = await (0, academy_v2_service_1.getPhase2Status)(Number(userId));
        return reply.send(status);
    }
    catch (error) {
        console.error('[academy-v3:phase2Status]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Phase 3 — Sandbox CRUD
// ═══════════════════════════════════════════════════════════════════
async function getSandboxOrgsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const orgs = await (0, academy_v2_service_1.getSandboxOrgs)(Number(userId));
        return reply.send(orgs);
    }
    catch (error) {
        console.error('[academy-v3:sandboxOrgs]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function createSandboxOrgHandler(request, reply) {
    try {
        const data = request.body;
        if (!data.userId || !data.name) {
            return reply.code(400).send({ message: 'userId and name are required' });
        }
        const org = await (0, academy_v2_service_1.createSandboxOrg)(Number(data.userId), data);
        return reply.code(201).send(org);
    }
    catch (error) {
        console.error('[academy-v3:createOrg]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function updateSandboxOrgHandler(request, reply) {
    try {
        const { id } = request.params;
        const data = request.body;
        if (!data.userId)
            return reply.code(400).send({ message: 'userId is required' });
        const org = await (0, academy_v2_service_1.updateSandboxOrg)(Number(data.userId), Number(id), data);
        return reply.send(org);
    }
    catch (error) {
        console.error('[academy-v3:updateOrg]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getSandboxContactsHandler(request, reply) {
    try {
        const { userId, orgId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const contacts = await (0, academy_v2_service_1.getSandboxContacts)(Number(userId), orgId ? Number(orgId) : undefined);
        return reply.send(contacts);
    }
    catch (error) {
        console.error('[academy-v3:sandboxContacts]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function createSandboxContactHandler(request, reply) {
    try {
        const data = request.body;
        if (!data.userId || !data.sandboxOrgId || !data.fullName) {
            return reply.code(400).send({ message: 'userId, sandboxOrgId, and fullName are required' });
        }
        const contact = await (0, academy_v2_service_1.createSandboxContact)(Number(data.userId), {
            sandbox_org_id: Number(data.sandboxOrgId),
            full_name: data.fullName,
            title: data.title,
            email: data.email,
            phone: data.phone,
            is_decision_maker: data.isDecisionMaker,
            source_citation: data.sourceCitation,
        });
        return reply.code(201).send(contact);
    }
    catch (error) {
        console.error('[academy-v3:createContact]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getSandboxOppsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const opps = await (0, academy_v2_service_1.getSandboxOpportunities)(Number(userId));
        return reply.send(opps);
    }
    catch (error) {
        console.error('[academy-v3:sandboxOpps]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function createSandboxOppHandler(request, reply) {
    try {
        const data = request.body;
        if (!data.userId || !data.sandboxOrgId || !data.lane) {
            return reply.code(400).send({ message: 'userId, sandboxOrgId, and lane are required' });
        }
        const opp = await (0, academy_v2_service_1.createSandboxOpportunity)(Number(data.userId), {
            sandbox_org_id: Number(data.sandboxOrgId),
            sandbox_contact_id: data.sandboxContactId ? Number(data.sandboxContactId) : null,
            name: data.name || `${data.lane} Opportunity`,
            estimated_value: data.estimatedValue || 0,
            target_close_date: data.targetCloseDate,
            lane: data.lane,
            stage: data.stage || 'LEAD',
            sport: data.sport,
            notes: data.notes,
            source_citation: data.sourceCitation,
        });
        return reply.code(201).send(opp);
    }
    catch (error) {
        console.error('[academy-v3:createOpp]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getSandboxActivitiesHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const activities = await (0, academy_v2_service_1.getSandboxActivities)(Number(userId));
        return reply.send(activities);
    }
    catch (error) {
        console.error('[academy-v3:sandboxActivities]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function createSandboxActivityHandler(request, reply) {
    try {
        const data = request.body;
        if (!data.userId || !data.activityType) {
            return reply.code(400).send({ message: 'userId and activityType are required' });
        }
        const activity = await (0, academy_v2_service_1.createSandboxActivity)(Number(data.userId), {
            sandbox_org_id: data.sandboxOrgId ? Number(data.sandboxOrgId) : null,
            sandbox_opp_id: data.sandboxOppId ? Number(data.sandboxOppId) : null,
            activity_type: data.activityType,
            description: data.description,
            notes: data.notes,
            template_used: data.templateUsed,
            scheduled_at: data.scheduledAt,
        });
        return reply.code(201).send(activity);
    }
    catch (error) {
        console.error('[academy-v3:createActivity]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getSandboxSummaryHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const summary = await (0, academy_v2_service_1.getSandboxSummary)(Number(userId));
        return reply.send(summary);
    }
    catch (error) {
        console.error('[academy-v3:sandboxSummary]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Phase 4 — Sales Execution
// ═══════════════════════════════════════════════════════════════════
async function createSalesExecutionHandler(request, reply) {
    try {
        const data = request.body;
        if (!data.userId || !data.executionType || !data.notes) {
            return reply.code(400).send({ message: 'userId, executionType, and notes are required' });
        }
        const exec = await (0, academy_v2_service_1.recordSalesExecution)(Number(data.userId), {
            execution_type: data.executionType,
            sandbox_org_id: data.sandboxOrgId ? Number(data.sandboxOrgId) : null,
            sandbox_opp_id: data.sandboxOppId ? Number(data.sandboxOppId) : null,
            notes: data.notes,
            objection_handled: data.objectionHandled,
            feedback: data.feedback,
            mentor_id: data.mentorId ? Number(data.mentorId) : null,
            score: data.score,
        });
        return reply.code(201).send(exec);
    }
    catch (error) {
        console.error('[academy-v3:salesExecution]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getSalesExecutionsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const execs = await (0, academy_v2_service_1.getSalesExecutions)(Number(userId));
        return reply.send(execs);
    }
    catch (error) {
        console.error('[academy-v3:getExecutions]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Lead Taxonomy
// ═══════════════════════════════════════════════════════════════════
async function getLeadsHandler(request, reply) {
    try {
        const { status, limit, offset } = request.query;
        const leads = await (0, academy_v2_service_1.getLeads)(status, limit ? Number(limit) : 100, offset ? Number(offset) : 0);
        return reply.send(leads);
    }
    catch (error) {
        console.error('[academy-v3:leads]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function postDedupScanHandler(request, reply) {
    try {
        const { userId } = request.body;
        const result = await (0, academy_v2_service_1.runDedupScan)(Number(userId || 1));
        return reply.send(result);
    }
    catch (error) {
        console.error('[academy-v3:dedupScan]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function postClaimLeadHandler(request, reply) {
    try {
        const { userId, leadId } = request.body;
        if (!userId || !leadId) {
            return reply.code(400).send({ message: 'userId and leadId are required' });
        }
        const result = await (0, academy_v2_service_1.claimLead)(Number(userId), Number(leadId));
        return reply.code(201).send(result);
    }
    catch (error) {
        console.error('[academy-v3:claimLead]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getClaimedLeadsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const leads = await (0, academy_v2_service_1.getClaimedLeads)(Number(userId));
        return reply.send(leads);
    }
    catch (error) {
        console.error('[academy-v3:claimedLeads]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Quality & Verification
// ═══════════════════════════════════════════════════════════════════
async function getQualityChecksHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const checks = await (0, academy_v2_service_1.getQualityChecks)(Number(userId));
        return reply.send(checks);
    }
    catch (error) {
        console.error('[academy-v3:qualityChecks]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function postRandomAuditHandler(request, reply) {
    try {
        const { userId, auditorId } = request.body;
        if (!userId || !auditorId) {
            return reply.code(400).send({ message: 'userId and auditorId are required' });
        }
        const audit = await (0, academy_v2_service_1.runRandomAudit)(Number(userId), Number(auditorId));
        return reply.code(201).send(audit);
    }
    catch (error) {
        console.error('[academy-v3:randomAudit]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getVerificationAuditsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const audits = await (0, academy_v2_service_1.getVerificationAudits)(Number(userId));
        return reply.send(audits);
    }
    catch (error) {
        console.error('[academy-v3:verificationAudits]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ═══════════════════════════════════════════════════════════════════
// Graduation
// ═══════════════════════════════════════════════════════════════════
async function getGraduationStatusHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const status = await (0, academy_v2_service_1.getGraduationStatus)(Number(userId));
        return reply.send(status);
    }
    catch (error) {
        console.error('[academy-v3:graduationStatus]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function postDirectorApprovalHandler(request, reply) {
    try {
        const { userId, directorId } = request.body;
        if (!userId || !directorId) {
            return reply.code(400).send({ message: 'userId and directorId are required' });
        }
        const grad = await (0, academy_v2_service_1.directorApproveGraduation)(Number(userId), Number(directorId));
        return reply.send(grad);
    }
    catch (error) {
        console.error('[academy-v3:directorApproval]', error.message);
        return reply.code(500).send({ message: error.message || 'Internal Server Error' });
    }
}
async function postPromoteSandboxDataHandler(request, reply) {
    try {
        const { userId, directorId } = request.body;
        if (!userId || !directorId) {
            return reply.code(400).send({ message: 'userId and directorId are required' });
        }
        const result = await (0, academy_v2_service_1.promoteSandboxData)(Number(userId), Number(directorId));
        return reply.send(result);
    }
    catch (error) {
        console.error('[academy-v3:promoteSandbox]', error.message);
        return reply.code(500).send({ message: error.message || 'Internal Server Error' });
    }
}
//# sourceMappingURL=academy-v2.controller.js.map