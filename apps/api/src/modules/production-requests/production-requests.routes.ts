
import { FastifyInstance } from 'fastify';
import {
    createProductionRequestHandler,
    updateProductionRequestStatusHandler,
    getProductionRequestsByOpportunityHandler,
} from './production-requests.controller';

export async function productionRequestRoutes(server: FastifyInstance) {
    server.post('/', createProductionRequestHandler);
    server.put('/:id/status', updateProductionRequestStatusHandler);
    server.get('/opportunity/:opportunityId', getProductionRequestsByOpportunityHandler);
}
