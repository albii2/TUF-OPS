import { FastifyRequest, FastifyReply } from 'fastify';
import {
  sendEmail,
  getEmailLogs,
  getEmailLog,
  getTemplates,
  getAccounts,
  getAccountStatus,
} from './email.service';
import {
  pollAllInboxes,
  getInboxAccountStatus,
  getInboxEmails,
  getInboxEmailById,
} from './email-ingestion.service';
import {
  analyzeEmail,
  getInboxWithAnalysis,
  getAnalysisByEmailId,
  getInboxStats,
  processUnprocessedEmails,
} from './email-analysis.service';

// ─── Send Email ─────────────────────────────────────────────────────

export async function sendHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    const user = (request as any).currentUser;
    if (!user?.id) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const required = ['from_account', 'to', 'subject'];
    for (const field of required) {
      if (!body[field]) {
        return reply.code(400).send({ error: `Missing required field: ${field}` });
      }
    }

    // At minimum we need body_html, body_text, or template_id
    if (!body.body_html && !body.body_text && !body.template_id) {
      return reply
        .code(400)
        .send({ error: 'Provide body_html, body_text, or template_id' });
    }

    const result = await sendEmail(
      {
        from_account: body.from_account,
        to: body.to,
        subject: body.subject,
        body_html: body.body_html,
        body_text: body.body_text,
        template_id: body.template_id ? Number(body.template_id) : undefined,
        template_vars: body.template_vars,
        entity_type: body.entity_type,
        entity_id: body.entity_id ? Number(body.entity_id) : undefined,
      },
      user.id,
    );

    return reply.code(201).send(result);
  } catch (error: any) {
    console.error('[email:send]', error.message);
    return reply.code(500).send({ error: error.message || 'Failed to send email' });
  }
}

// ─── Email Log ──────────────────────────────────────────────────────

export async function logListHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const logs = await getEmailLogs({
      entity_type: query.entity_type,
      entity_id: query.entity_id ? Number(query.entity_id) : undefined,
      from_account: query.from_account,
      limit: query.limit ? Number(query.limit) : 50,
      offset: query.offset ? Number(query.offset) : 0,
    });
    return reply.send({ logs });
  } catch (error: any) {
    console.error('[email:logList]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch email logs' });
  }
}

export async function logGetHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const log = await getEmailLog(Number(id));
    if (!log) return reply.code(404).send({ error: 'Email log entry not found' });
    return reply.send(log);
  } catch (error: any) {
    console.error('[email:logGet]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch email log' });
  }
}

// ─── Templates ──────────────────────────────────────────────────────

export async function templatesListHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const query = request.query as any;
    const templates = await getTemplates(query.category);
    return reply.send({ templates });
  } catch (error: any) {
    console.error('[email:templates]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch templates' });
  }
}

// ─── Accounts ───────────────────────────────────────────────────────

export async function accountsListHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const accounts = getAccounts();
    return reply.send({ accounts });
  } catch (error: any) {
    console.error('[email:accounts]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch accounts' });
  }
}

export async function accountStatusHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const status = getAccountStatus();
    return reply.send({ accounts: status });
  } catch (error: any) {
    console.error('[email:accountStatus]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch account status' });
  }
}

// ─── Inbound Email Handlers ──────────────────────────────────────

export async function inboxListHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const query = request.query as any;
    const emails = await getInboxWithAnalysis({
      account: query.account,
      classification: query.classification,
      priority: query.priority,
      processed: query.processed !== undefined ? query.processed === 'true' : undefined,
      limit: query.limit ? Number(query.limit) : 50,
      offset: query.offset ? Number(query.offset) : 0,
    });
    return reply.send({ emails });
  } catch (error: any) {
    console.error('[email:inboxList]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch inbox emails' });
  }
}

export async function inboxGetHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };
    const email = await getInboxEmailById(Number(id));
    if (!email) return reply.code(404).send({ error: 'Email not found' });

    const analysis = await getAnalysisByEmailId(Number(id));
    return reply.send({ email, analysis });
  } catch (error: any) {
    console.error('[email:inboxGet]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch email' });
  }
}

export async function inboxAnalyzeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };
    const analysis = await analyzeEmail(Number(id));
    if (!analysis) return reply.code(404).send({ error: 'Email not found or analysis failed' });
    return reply.send({ analysis });
  } catch (error: any) {
    console.error('[email:inboxAnalyze]', error.message);
    return reply.code(500).send({ error: 'Failed to analyze email' });
  }
}

export async function inboxPollHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const result = await pollAllInboxes();
    // After polling, process new emails
    const processResult = await processUnprocessedEmails(25);
    return reply.send({
      poll: result,
      processed: processResult,
    });
  } catch (error: any) {
    console.error('[email:inboxPoll]', error.message);
    return reply.code(500).send({ error: 'Failed to poll inboxes' });
  }
}

export async function inboxProcessHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const query = request.query as any;
    const result = await processUnprocessedEmails(
      query.limit ? Number(query.limit) : 25,
    );
    return reply.send(result);
  } catch (error: any) {
    console.error('[email:inboxProcess]', error.message);
    return reply.code(500).send({ error: 'Failed to process emails' });
  }
}

export async function inboxStatsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const stats = await getInboxStats();
    return reply.send(stats);
  } catch (error: any) {
    console.error('[email:inboxStats]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch inbox stats' });
  }
}

export async function inboxAccountStatusHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const accounts = getInboxAccountStatus();
    return reply.send({ accounts });
  } catch (error: any) {
    console.error('[email:inboxAccountStatus]', error.message);
    return reply.code(500).send({ error: 'Failed to fetch inbox account status' });
  }
}
