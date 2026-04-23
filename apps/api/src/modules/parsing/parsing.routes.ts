import { FastifyInstance } from 'fastify';
import { createUploadHandler, getUploadStatusHandler, ingestUploadRowsHandler, normalizeUploadHandler, retryUploadHandler } from './parsing.controller';

export async function parsingRoutes(server: FastifyInstance) {
  server.post('/uploads', createUploadHandler);
  server.post('/uploads/:uploadId/rows', ingestUploadRowsHandler);
  server.post('/uploads/:uploadId/normalize', normalizeUploadHandler);
  server.get('/uploads/:uploadId/status', getUploadStatusHandler);
  server.post('/uploads/:uploadId/retry', retryUploadHandler);
}
