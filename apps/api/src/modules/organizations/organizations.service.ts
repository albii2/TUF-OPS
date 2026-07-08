import { pool } from '@packages/database';
import { OpportunityChannelType } from '../opportunities/opportunities.interface';
import { STAGES } from '@packages/auth';
import { resolveUserId } from '../shared/resolve-user';

const REQUIRED_CHANNELS: OpportunityChannelType[] = [
  OpportunityChannelType.UNIFORM,
  OpportunityChannelType.TRAVEL_GEAR,
  OpportunityChannelType.TEAM_STORE,
  OpportunityChannelType.LETTERMAN,
];

function normalizeName(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeState(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function createOrganization(organization: any) {
  // Accept both frontend camelCase names and backend snake_case IDs
  const name = normalizeName(organization.name);
  const state = normalizeState(organization.state);

  if (!name) {
    throw new Error('Organization name is required');
  }

  // Resolve rep/director names to IDs if needed
  const repName = organization.assignedRep || organization.assigned_rep_name;
  const directorName = organization.assignedDirector || organization.assigned_director_name;
  const assigned_rep_id = organization.assigned_rep_id ?? (repName ? await resolveUserId(repName) : null);
  const assigned_director_id = organization.assigned_director_id ?? (directorName ? await resolveUserId(directorName) : null);
  const territory_id = organization.territory_id ?? organization.territoryId ?? null;
  const created_by = organization.created_by ?? organization.createdBy ?? assigned_rep_id ?? 1;
  const updated_by = organization.updated_by ?? organization.updatedBy ?? created_by;

  const client = await pool.connect();

  try {
    // Insert organization immediately — don't wait for auto-opportunities
    await client.query('BEGIN');
    const orgResult = await client.query(
      'INSERT INTO organizations (name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]
    );
    const createdOrganization = orgResult.rows[0];
    await client.query('COMMIT');

    // Fire-and-forget: create auto-opportunities in the background
    // Don't block the response — org is saved, opps will populate async
    const oppCreatedBy = created_by;
    const oppUpdatedBy = updated_by;
    const oppRepId = assigned_rep_id;
    const oppDirId = assigned_director_id;
    const oppOrgId = createdOrganization.id;
    const oppName = name;
    
    setImmediate(async () => {
      try {
        for (const channelType of REQUIRED_CHANNELS) {
          await pool.query(
            `INSERT INTO opportunities (name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, last_activity_date, assigned_rep_id, assigned_director_id, deal_type, channel_type)
             VALUES ($1, $2, 'FOOTBALL', 'FALL', 2026, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)`,
            [`${oppName} - ${channelType}`, oppOrgId, 'open', 0.00, oppCreatedBy, oppUpdatedBy, STAGES.LEAD, oppRepId, oppDirId, channelType, channelType]
          );
        }
      } catch (oppError) {
        console.error('createOrganization: auto-opportunity creation failed:', oppError);
      }
    });

    return createdOrganization;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createOrganization DB error:', error, 'Stack:', (error as any)?.stack);
    if (isUniqueViolation(error)) {
      throw new Error('Organization already exists for this name and state');
    }
    throw error;
  } finally {
    client.release();
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
  const name = normalizeName(organization.name);
  const state = normalizeState(organization.state);

  if (!name) {
    throw new Error('Organization name is required');
  }

  // Resolve rep/director names to IDs — frontend sends camelCase names,
  // backend expects snake_case numeric IDs
  const repName = organization.assignedRep || organization.assigned_rep_name;
  const directorName = organization.assignedDirector || organization.assigned_director_name;
  const assigned_rep_id = organization.assigned_rep_id ?? (repName ? await resolveUserId(repName) : null);
  const assigned_director_id = organization.assigned_director_id ?? (directorName ? await resolveUserId(directorName) : null);
  const territory_id = organization.territory_id ?? organization.territoryId ?? null;
  const updated_by = organization.updated_by ?? organization.updatedBy ?? assigned_rep_id ?? 1;

  try {
    const result = await pool.query(
      'UPDATE organizations SET name = $1, state = $2, assigned_rep_id = $3, assigned_director_id = $4, territory_id = $5, updated_by = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, state, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]
    );
    return result.rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error('Organization already exists for this name and state');
    }
    throw error;
  }
}

export async function deleteOrganization(id: string) {
  await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
