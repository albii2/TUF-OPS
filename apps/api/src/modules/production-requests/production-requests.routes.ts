
import { FastifyInstance } from 'fastify';
import { requireCertification } from '../../auth';
import {
    createProductionRequestHandler,
    updateProductionRequestStatusHandler,
    getProductionRequestsByOpportunityHandler,
} from './production-requests.controller';

export async function productionRequestRoutes(server: FastifyInstance) {
    server.post('/', { preHandler: [requireCertification()] }, createProductionRequestHandler);
    server.put('/:id/status', { preHandler: [requireCertification()] }, updateProductionRequestStatusHandler);
    server.get('/opportunity/:opportunityId', { preHandler: [requireCertification()] }, getProductionRequestsByOpportunityHandler);
}
