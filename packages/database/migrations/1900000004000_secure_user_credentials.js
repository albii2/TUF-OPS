const crypto = require('crypto');


function requireInitialOwnerCredential() {
  const credential = process.env.INITIAL_OWNER_CREDENTIAL;
  if (!credential) throw new Error('INITIAL_OWNER_CREDENTIAL is required before running secure user credential migration');
  if (!/^\d{4,}$/.test(credential)) throw new Error('INITIAL_OWNER_CREDENTIAL must be at least 4 numbers');
  return credential;
}

function bootstrapHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

exports.shorthands = undefined;

exports.up = (pgm) => {
  const initialOwnerCredentialHash = bootstrapHash(requireInitialOwnerCredential());

  pgm.addColumn('users', {
    role: { type: 'varchar(50)', notNull: true, default: 'REP' },
    territory: { type: 'varchar(50)' },
    assigned_director_id: { type: 'integer' },
    credential_hash: { type: 'varchar(512)' },
    must_change_credential: { type: 'boolean', notNull: true, default: true },
    status: { type: 'varchar(50)', notNull: true, default: 'ACTIVE' },
    failed_credential_attempts: { type: 'integer', notNull: true, default: 0 },
    locked_until: { type: 'timestamp' },
    last_login_at: { type: 'timestamp' },
  });
  // Do not migrate legacy plain-text/recoverable values into the new credential column.
  // Existing users must receive a one-time reset after this migration.
  pgm.sql("UPDATE users SET credential_hash = 'MIGRATION_REQUIRES_ADMIN_RESET' WHERE credential_hash IS NULL");

  // Preserve an admin path for databases that already contain legacy users.
  // The selected bootstrap owner receives a freshly hashed temporary credential and must change it on login.
  pgm.sql(`UPDATE users
    SET role = 'OWNER', credential_hash = '${initialOwnerCredentialHash.replace(/'/g, "''")}', must_change_credential = true, status = 'ACTIVE'
    WHERE id = (SELECT id FROM users ORDER BY CASE WHEN lower(email) IN ('owner@tuf.local', 'coach@tuf.local') OR lower(name) LIKE '%bradshaw%' THEN 0 ELSE 1 END, id LIMIT 1)`);
  pgm.alterColumn('users', 'credential_hash', { notNull: true });
  pgm.dropColumn('users', 'password');
  pgm.addConstraint('users', 'users_role_check', "CHECK (role IN ('OWNER', 'ADMIN', 'DIRECTOR', 'REP', 'OPS'))");
  pgm.addConstraint('users', 'users_status_check', "CHECK (status IN ('ACTIVE', 'INACTIVE'))");

  pgm.createTable('credential_audit_logs', {
    id: 'id',
    action: { type: 'varchar(80)', notNull: true },
    target_user_id: { type: 'integer' },
    actor_user_id: { type: 'integer' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('credential_audit_logs', ['target_user_id', 'created_at']);
  pgm.createIndex('credential_audit_logs', ['actor_user_id', 'created_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('credential_audit_logs');
  pgm.addColumn('users', {
    password: { type: 'varchar(255)', notNull: true, default: 'MIGRATION_REQUIRES_RESET' },
  });
  pgm.dropConstraint('users', 'users_role_check');
  pgm.dropConstraint('users', 'users_status_check');
  pgm.dropColumn('users', 'role');
  pgm.dropColumn('users', 'territory');
  pgm.dropColumn('users', 'assigned_director_id');
  pgm.dropColumn('users', 'credential_hash');
  pgm.dropColumn('users', 'must_change_credential');
  pgm.dropColumn('users', 'status');
  pgm.dropColumn('users', 'failed_credential_attempts');
  pgm.dropColumn('users', 'locked_until');
  pgm.dropColumn('users', 'last_login_at');
};
