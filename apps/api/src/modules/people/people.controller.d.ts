import { FastifyReply, FastifyRequest } from 'fastify';
export declare function listHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function createHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function advanceHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function statsHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=people.controller.d.ts.map