import { FastifyInstance } from 'fastify';
import { paypalWebhookHandler } from './webhooks.controller';

export default async function (fastify: FastifyInstance) {
  fastify.post('/webhooks/paypal', paypalWebhookHandler);
}
