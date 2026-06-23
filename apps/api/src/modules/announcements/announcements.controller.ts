import { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '@packages/database';

const BROADCASTER_ROLES = ['ADMIN', 'DIRECTOR', 'REGIONAL_DIRECTOR'];

function extractUserFromHeaders(request: FastifyRequest): { id: string; name: string; role: string } | null {
  const userId = request.headers['x-user-id'] as string;
  const userName = request.headers['x-user-name'] as string;
  const userRole = request.headers['x-user-role'] as string;
  if (!userId || !userName || !userRole) return null;
  return { id: userId, name: userName, role: userRole };
}

export async function listAnnouncementsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { limit } = request.query as { limit?: string };
    const max = Math.min(Number(limit) || 50, 100);
    const result = await pool.query(
      'SELECT id, sender_id, sender_name, sender_role, title, content, importance, created_at FROM announcements ORDER BY created_at DESC LIMIT $1',
      [max],
    );
    return reply.send(result.rows);
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ message: 'Failed to fetch announcements' });
  }
}

export async function createAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = extractUserFromHeaders(request);
    if (!user) {
      return reply.code(401).send({ message: 'Missing user identity headers (x-user-id, x-user-name, x-user-role)' });
    }
    if (!BROADCASTER_ROLES.includes(user.role.toUpperCase())) {
      return reply.code(403).send({ message: 'Only Admins, Directors, and Regional Directors can create announcements.' });
    }

    const { title, content, importance } = request.body as { title?: string; content?: string; importance?: string };
    if (!title || !content) {
      return reply.code(400).send({ message: 'title and content are required' });
    }

    const importanceValue = importance === 'CRITICAL' ? 'CRITICAL' : 'NORMAL';

    const result = await pool.query(
      `INSERT INTO announcements (sender_id, sender_name, sender_role, title, content, importance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sender_id, sender_name, sender_role, title, content, importance, created_at`,
      [user.id, user.name, user.role, title, content, importanceValue],
    );

    return reply.code(201).send(result.rows[0]);
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ message: 'Failed to create announcement' });
  }
}

export async function deleteAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = extractUserFromHeaders(request);
    if (!user || !BROADCASTER_ROLES.includes(user.role.toUpperCase())) {
      return reply.code(403).send({ message: 'Insufficient permissions' });
    }

    const { id } = request.params as { id: string };
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return reply.code(404).send({ message: 'Announcement not found' });
    }
    return reply.send({ deleted: true, id });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ message: 'Failed to delete announcement' });
  }
}
