import { pool } from '@packages/database';

export interface AcademyResource {
  id: number;
  slug: string;
  title: string;
  kind: string;
  body_markdown: string | null;
  external_url: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export async function listResources(): Promise<AcademyResource[]> {
  const result = await pool.query(
    `SELECT id, slug, title, kind, body_markdown, external_url, sort_order, is_active, updated_at
     FROM academy_resources
     WHERE is_active = true
     ORDER BY sort_order ASC, title ASC`,
  );
  return result.rows;
}

export async function getResourceBySlug(slug: string): Promise<AcademyResource | null> {
  const result = await pool.query(
    `SELECT id, slug, title, kind, body_markdown, external_url, sort_order, is_active, updated_at
     FROM academy_resources
     WHERE slug = $1 AND is_active = true`,
    [slug],
  );
  return result.rows[0] || null;
}
