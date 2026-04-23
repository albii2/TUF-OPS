import { pool } from '@packages/database';
import { OpportunityChannelType, OpportunityStage } from '../opportunities/opportunities.interface';

const REQUIRED_CHANNELS: OpportunityChannelType[] = [
  OpportunityChannelType.UNIFORM,
  OpportunityChannelType.TRAVEL_GEAR,
  OpportunityChannelType.TEAM_STORE,
  OpportunityChannelType.LETTERMAN,
];

async function ensureRequiredChannelOpportunities(client: any, organization: { id: number; name: string; assigned_rep_id?: number; assigned_director_id?: number; created_by?: number; updated_by?: number; }) {
  for (const channelType of REQUIRED_CHANNELS) {
    await client.query(
      `
      INSERT INTO opportunities (
        name,
        organization_id,
        status,
        value,
        created_by,
        updated_by,
        stage,
        last_activity_date,
        assigned_rep_id,
        assigned_director_id,
        deal_type,
        channel_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)
      ON CONFLICT (organization_id, channel_type) WHERE channel_type IS NOT NULL DO NOTHING
      `,
      [
        `${organization.name} - ${channelType}`,
        organization.id,
        'open',
        0.0,
        organization.created_by ?? 1,
        organization.updated_by ?? 1,
        OpportunityStage.NOT_STARTED,
        organization.assigned_rep_id,
        organization.assigned_director_id,
        channelType,
        channelType,
      ]
    );
  }
}

export async function createOrganization(organization: any) {
  const { name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      'INSERT INTO organizations (name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]
    );

    const createdOrganization = orgResult.rows[0];
    await ensureRequiredChannelOpportunities(client, createdOrganization);

    await client.query('COMMIT');
    return createdOrganization;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrganizations() {
  const result = await pool.query('SELECT * FROM organizations ORDER BY id DESC');
  return result.rows;
}

export async function getOrganizationById(id: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const organization = orgResult.rows[0];
    await ensureRequiredChannelOpportunities(client, organization);

    const opportunitiesResult = await client.query(
      `
      SELECT id, name, stage, channel_type, status, value, updated_at
      FROM opportunities
      WHERE organization_id = $1
        AND channel_type IS NOT NULL
      ORDER BY CASE channel_type
        WHEN 'UNIFORM' THEN 1
        WHEN 'TRAVEL_GEAR' THEN 2
        WHEN 'TEAM_STORE' THEN 3
        WHEN 'LETTERMAN' THEN 4
        ELSE 5 END
      `,
      [id]
    );

    await client.query('COMMIT');

    return {
      ...organization,
      lanes: opportunitiesResult.rows,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function backfillOrganizationChannels() {
  const client = await pool.connect();
  try {
    const orgs = await client.query('SELECT * FROM organizations');
    for (const org of orgs.rows) {
      await ensureRequiredChannelOpportunities(client, org);
    }

    return { organizationsProcessed: orgs.rows.length };
  } finally {
    client.release();
  }
}

export async function updateOrganization(id: string, organization: any) {
  const { name, assigned_rep_id, assigned_director_id, territory_id, updated_by } = organization;
  const result = await pool.query(
    'UPDATE organizations SET name = $1, assigned_rep_id = $2, assigned_director_id = $3, territory_id = $4, updated_by = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
    [name, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]
  );
  return result.rows[0];
}

export async function deleteOrganization(id: string) {
  await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
