import type { FastifyReply, FastifyRequest } from 'fastify';
export declare function listIssuesHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getIssueHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function createIssueHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function updateIssueHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function updateIssueStatusHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=issues.controller.d.ts.map