
import { FastifyRequest, FastifyReply } from 'fastify';
import {
    createProductionRequest,
    updateProductionRequestStatus,
    getProductionRequestsByOpportunity,
} from './production-requests.service';
import { ProductionRequestStatus } from './production-requests.interface';

export async function createProductionRequestHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const productionRequest = await createProductionRequest(request.body as any);
        reply.code(201).send(productionRequest);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}

export async function updateProductionRequestStatusHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: number };
        const { status } = request.body as { status: ProductionRequestStatus };
        const productionRequest = await updateProductionRequestStatus(id, status);
        reply.send(productionRequest);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}

export async function getProductionRequestsByOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { opportunityId } = request.params as { opportunityId: number };
        const productionRequests = await getProductionRequestsByOpportunity(opportunityId);
        reply.send(productionRequests);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}
