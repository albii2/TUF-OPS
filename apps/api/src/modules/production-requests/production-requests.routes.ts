
import { FastifyInstance } from 'fastify';
import {
    createProductionRequestHandler,
    updateProductionRequestStatusHandler,
    getProductionRequestsByOpportunityHandler,
} from './production-requests.controller';

export async function productionRequestRoutes(server: FastifyInstance) {
    server.post('/production-requests', createProductionRequestHandler);
    server.put('/production-requests/:id/status', updateProductionRequestStatusHandler);
    server.get('/production-requests/opportunity/:opportunityId', getProductionRequestsByOpportunityHandler);
}
