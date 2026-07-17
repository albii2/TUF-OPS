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
//# sourceMappingURL=intake.controller.d.ts.map