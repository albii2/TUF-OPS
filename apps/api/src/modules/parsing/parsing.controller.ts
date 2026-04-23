import { FastifyReply, FastifyRequest } from 'fastify';
import { createUpload, getUploadStatus, ingestRows, normalizeUpload, retryUpload } from './parsing.service';

export async function createUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as any;
  const upload = await createUpload(body.file_name, body.file_path, body.order_type ?? 'UNIFORM', body.uploaded_by_user_id);
  return reply.code(201).send(upload);
}

export async function ingestUploadRowsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { uploadId } = request.params as any;
  const body = request.body as any;
  const result = await ingestRows(Number(uploadId), body.rows ?? []);
  return reply.send(result);
}

export async function normalizeUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { uploadId } = request.params as any;
  const body = request.body as any;
  const result = await normalizeUpload(Number(uploadId), Number(body.order_id));
  return reply.send(result);
}

export async function getUploadStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { uploadId } = request.params as any;
  const result = await getUploadStatus(Number(uploadId));
  return reply.send(result);
}

export async function retryUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { uploadId } = request.params as any;
  const result = await retryUpload(Number(uploadId));
  return reply.send(result);
}
