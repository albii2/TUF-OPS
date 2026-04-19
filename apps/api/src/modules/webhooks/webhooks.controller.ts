import { FastifyRequest, FastifyReply } from 'fastify';
import { confirmPayment } from '../opportunities/opportunities.service';

interface PayPalWebhookPayload {
  resource?: {
    invoice_id?: string; // Assuming invoice_id maps to opportunityId
  };
}

export async function paypalWebhookHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = request.body as PayPalWebhookPayload;
    const opportunityIdString = payload.resource?.invoice_id;

    if (!opportunityIdString) {
      return reply.code(400).send({ error: 'Missing opportunityId in PayPal webhook payload' });
    }

    const opportunityId = parseInt(opportunityIdString, 10);
    if (!Number.isInteger(opportunityId)) {
      return reply.code(400).send({ error: 'Invalid opportunityId in PayPal webhook payload' });
    }

    await confirmPayment(opportunityId, {
      source: 'PAYPAL_WEBHOOK',
      confirmedByUserId: null,
    });

    reply.code(200).send({ status: 'success' });
  } catch (error) {
    // @ts-ignore
    reply.code(500).send({ error: error.message });
  }
}
