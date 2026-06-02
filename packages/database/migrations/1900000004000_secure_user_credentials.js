exports.shorthands = undefined;

exports.up = (pgm) => {
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
