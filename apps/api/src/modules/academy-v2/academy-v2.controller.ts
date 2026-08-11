import { FastifyRequest, FastifyReply } from 'fastify';
import {
  recordQuizAttempt,
  getPhase1Status,
  completeWalkthroughStep,
  getPhase2Status,
  createSandboxOrg,
  getSandboxOrgs,
  getSandboxOrg,
  updateSandboxOrg,
  createSandboxContact,
  getSandboxContacts,
  createSandboxOpportunity,
  getSandboxOpportunities,
  createSandboxActivity,
  getSandboxActivities,
  getSandboxSummary,
  recordSalesExecution,
  getSalesExecutions,
  getLeads,
  runDedupScan,
  claimLead,
  getClaimedLeads,
  getQualityChecks,
  runRandomAudit,
  getVerificationAudits,
  getGraduationStatus,
  directorApproveGraduation,
  promoteSandboxData,
} from './academy-v2.service';
import { LeadStatus } from './academy-v2.interface';

// ═══════════════════════════════════════════════════════════════════
// Phase 1 — Quizzes
// ═══════════════════════════════════════════════════════════════════

export async function postQuizAttemptHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, quizId, score, passed, answers } = request.body as any;
    if (!userId || !quizId || score === undefined || passed === undefined) {
      return reply.code(400).send({ message: 'userId, quizId, score, and passed are required' });
    }

    const result = await recordQuizAttempt(Number(userId), quizId, Number(score), !!passed, answers || []);
    return reply.code(201).send(result);
  } catch (error: any) {
    console.error('[academy-v3:postQuiz]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getPhase1StatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const status = await getPhase1Status(Number(userId));
    return reply.send(status);
  } catch (error: any) {
    console.error('[academy-v3:phase1Status]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Phase 2 — CRM Walkthrough
// ═══════════════════════════════════════════════════════════════════

export async function postWalkthroughStepHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, stepId } = request.body as any;
    if (!userId || !stepId) {
      return reply.code(400).send({ message: 'userId and stepId are required' });
    }
    const result = await completeWalkthroughStep(Number(userId), stepId);
    return reply.code(201).send(result);
  } catch (error: any) {
    console.error('[academy-v3:walkthrough]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getPhase2StatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const status = await getPhase2Status(Number(userId));
    return reply.send(status);
  } catch (error: any) {
    console.error('[academy-v3:phase2Status]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3 — Sandbox CRUD
// ═══════════════════════════════════════════════════════════════════

export async function getSandboxOrgsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const orgs = await getSandboxOrgs(Number(userId));
    return reply.send(orgs);
  } catch (error: any) {
    console.error('[academy-v3:sandboxOrgs]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function createSandboxOrgHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    if (!data.userId || !data.name) {
      return reply.code(400).send({ message: 'userId and name are required' });
    }
    const org = await createSandboxOrg(Number(data.userId), data);
    return reply.code(201).send(org);
  } catch (error: any) {
    console.error('[academy-v3:createOrg]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function updateSandboxOrgHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const data = request.body as any;
    if (!data.userId) return reply.code(400).send({ message: 'userId is required' });
    const org = await updateSandboxOrg(Number(data.userId), Number(id), data);
    return reply.send(org);
  } catch (error: any) {
    console.error('[academy-v3:updateOrg]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getSandboxContactsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, orgId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const contacts = await getSandboxContacts(Number(userId), orgId ? Number(orgId) : undefined);
    return reply.send(contacts);
  } catch (error: any) {
    console.error('[academy-v3:sandboxContacts]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function createSandboxContactHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    if (!data.userId || !data.sandboxOrgId || !data.fullName) {
      return reply.code(400).send({ message: 'userId, sandboxOrgId, and fullName are required' });
    }
    const contact = await createSandboxContact(Number(data.userId), {
      sandbox_org_id: Number(data.sandboxOrgId),
      full_name: data.fullName,
      title: data.title,
      email: data.email,
      phone: data.phone,
      is_decision_maker: data.isDecisionMaker,
      source_citation: data.sourceCitation,
    });
    return reply.code(201).send(contact);
  } catch (error: any) {
    console.error('[academy-v3:createContact]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getSandboxOppsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const opps = await getSandboxOpportunities(Number(userId));
    return reply.send(opps);
  } catch (error: any) {
    console.error('[academy-v3:sandboxOpps]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function createSandboxOppHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    if (!data.userId || !data.sandboxOrgId || !data.lane) {
      return reply.code(400).send({ message: 'userId, sandboxOrgId, and lane are required' });
    }
    const opp = await createSandboxOpportunity(Number(data.userId), {
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
  } catch (error: any) {
    console.error('[academy-v3:createOpp]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getSandboxActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const activities = await getSandboxActivities(Number(userId));
    return reply.send(activities);
  } catch (error: any) {
    console.error('[academy-v3:sandboxActivities]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function createSandboxActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    if (!data.userId || !data.activityType) {
      return reply.code(400).send({ message: 'userId and activityType are required' });
    }
    const activity = await createSandboxActivity(Number(data.userId), {
      sandbox_org_id: data.sandboxOrgId ? Number(data.sandboxOrgId) : null,
      sandbox_opp_id: data.sandboxOppId ? Number(data.sandboxOppId) : null,
      activity_type: data.activityType,
      description: data.description,
      notes: data.notes,
      template_used: data.templateUsed,
      scheduled_at: data.scheduledAt,
    });
    return reply.code(201).send(activity);
  } catch (error: any) {
    console.error('[academy-v3:createActivity]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getSandboxSummaryHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const summary = await getSandboxSummary(Number(userId));
    return reply.send(summary);
  } catch (error: any) {
    console.error('[academy-v3:sandboxSummary]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Phase 4 — Sales Execution
// ═══════════════════════════════════════════════════════════════════

export async function createSalesExecutionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    if (!data.userId || !data.executionType || !data.notes) {
      return reply.code(400).send({ message: 'userId, executionType, and notes are required' });
    }
    const exec = await recordSalesExecution(Number(data.userId), {
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
  } catch (error: any) {
    console.error('[academy-v3:salesExecution]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getSalesExecutionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const execs = await getSalesExecutions(Number(userId));
    return reply.send(execs);
  } catch (error: any) {
    console.error('[academy-v3:getExecutions]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Lead Taxonomy
// ═══════════════════════════════════════════════════════════════════

export async function getLeadsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, limit, offset } = request.query as any;
    const leads = await getLeads(
      status as LeadStatus | undefined,
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0
    );
    return reply.send(leads);
  } catch (error: any) {
    console.error('[academy-v3:leads]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function postDedupScanHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.body as any;
    const result = await runDedupScan(Number(userId || 1));
    return reply.send(result);
  } catch (error: any) {
    console.error('[academy-v3:dedupScan]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function postClaimLeadHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, leadId } = request.body as any;
    if (!userId || !leadId) {
      return reply.code(400).send({ message: 'userId and leadId are required' });
    }
    const result = await claimLead(Number(userId), Number(leadId));
    return reply.code(201).send(result);
  } catch (error: any) {
    console.error('[academy-v3:claimLead]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getClaimedLeadsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const leads = await getClaimedLeads(Number(userId));
    return reply.send(leads);
  } catch (error: any) {
    console.error('[academy-v3:claimedLeads]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Quality & Verification
// ═══════════════════════════════════════════════════════════════════

export async function getQualityChecksHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const checks = await getQualityChecks(Number(userId));
    return reply.send(checks);
  } catch (error: any) {
    console.error('[academy-v3:qualityChecks]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function postRandomAuditHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, auditorId } = request.body as any;
    if (!userId || !auditorId) {
      return reply.code(400).send({ message: 'userId and auditorId are required' });
    }
    const audit = await runRandomAudit(Number(userId), Number(auditorId));
    return reply.code(201).send(audit);
  } catch (error: any) {
    console.error('[academy-v3:randomAudit]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getVerificationAuditsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const audits = await getVerificationAudits(Number(userId));
    return reply.send(audits);
  } catch (error: any) {
    console.error('[academy-v3:verificationAudits]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Graduation
// ═══════════════════════════════════════════════════════════════════

export async function getGraduationStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });
    const status = await getGraduationStatus(Number(userId));
    return reply.send(status);
  } catch (error: any) {
    console.error('[academy-v3:graduationStatus]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function postDirectorApprovalHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, directorId } = request.body as any;
    if (!userId || !directorId) {
      return reply.code(400).send({ message: 'userId and directorId are required' });
    }
    const grad = await directorApproveGraduation(Number(userId), Number(directorId));
    return reply.send(grad);
  } catch (error: any) {
    console.error('[academy-v3:directorApproval]', error.message);
    return reply.code(500).send({ message: error.message || 'Internal Server Error' });
  }
}

export async function postPromoteSandboxDataHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, directorId } = request.body as any;
    if (!userId || !directorId) {
      return reply.code(400).send({ message: 'userId and directorId are required' });
    }
    const result = await promoteSandboxData(Number(userId), Number(directorId));
    return reply.send(result);
  } catch (error: any) {
    console.error('[academy-v3:promoteSandbox]', error.message);
    return reply.code(500).send({ message: error.message || 'Internal Server Error' });
  }
}
