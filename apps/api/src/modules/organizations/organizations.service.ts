import { pool } from '@packages/database';
import { OpportunityChannelType, OpportunityStage } from '../opportunities/opportunities.interface';

const REQUIRED_CHANNELS: OpportunityChannelType[] = [
  OpportunityChannelType.UNIFORM,
  OpportunityChannelType.TRAVEL_GEAR,
  OpportunityChannelType.TEAM_STORE,
  OpportunityChannelType.LETTERMAN,
];

export async function createOrganization(organization: any) {
  try {
    const { name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orgResult = await client.query(
        'INSERT INTO organizations (name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]
      );

      const createdOrganization = orgResult.rows[0];

      for (const channelType of REQUIRED_CHANNELS) {
        console.log('Inserting opportunity with params:', [
          `${name} - ${channelType}`,
          createdOrganization.id,
          'open',
          0.00,
          created_by,
          updated_by,
          OpportunityStage.LEAD_ASSIGNED,
          assigned_rep_id,
          assigned_director_id,
          channelType,
          channelType,
        ]);
        await client.query(
          `
          INSERT INTO opportunities (
            name,
            organization_id,
            sport,
            season,
            year,
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
          ) VALUES ($1, $2, 'FOOTBALL', 'FALL', 2026, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)
          `,
          [
            `${name} - ${channelType}`,
            createdOrganization.id,
            'open',
            0.00,
            created_by,
            updated_by,
            OpportunityStage.LEAD_ASSIGNED,
            assigned_rep_id,
            assigned_director_id,
            channelType,
            channelType,
          ]
        );
      }

      await client.query('COMMIT');
      return createdOrganization;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in createOrganization:', error);
    throw error;
  }
}

export async function getOrganizations() {
  const result = await pool.query('SELECT * FROM organizations');
  return result.rows;
}

export async function getOrganizationById(id: string) {
  const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
  return result.rows[0] || null;
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
