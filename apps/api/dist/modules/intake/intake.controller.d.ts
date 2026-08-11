import { FastifyReply, FastifyRequest } from 'fastify';
export declare function listHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function createHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function updateHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function deleteHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function decisionsHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Executive Command Center — Lighthouse view
 * Returns scored, classified open items grouped by urgency.
 */
export declare function lighthouseHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * POST /api/intake/status-check — create a batch of status check items.
 * One intake item per recipient. Each tracks response status.
 */
export declare function createStatusCheckHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * GET /api/intake/status-check — get response summary.
 * Shows who responded vs who hasn't.
 */
export declare function getStatusCheckHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=intake.controller.d.ts.map