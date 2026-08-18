import { FastifyRequest, FastifyReply } from 'fastify';
import { listResources, getResourceBySlug } from './academy-resources.service';

export async function listResourcesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resources = await listResources();
    return reply.send(resources);
  } catch (error: any) {
    console.error('[academy-resources:list]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getResourceHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { slug } = request.params as any;
    const resource = await getResourceBySlug(slug);
    if (!resource) return reply.code(404).send({ message: 'Resource not found' });
    return reply.send(resource);
  } catch (error: any) {
    console.error('[academy-resources:get]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}
