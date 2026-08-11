import { FastifyReply, FastifyRequest } from 'fastify';
export declare function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getMeHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function listUsersHandler(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function createUserHandler(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function resetCredentialHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<undefined>;
export declare function changeCredentialHandler(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function certifyUserHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<undefined>;
export declare function setUserStatusHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<undefined>;
export declare function updateUserHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=users.controller.d.ts.map