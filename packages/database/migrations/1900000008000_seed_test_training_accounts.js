const crypto = require('crypto');

exports.shorthands = undefined;

function credentialHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

function upsertUserSql({ name, email, role, territory, assignedDirectorEmail }) {
  const escapedName = name.replace(/'/g, "''");
  const escapedEmail = email.toLowerCase().replace(/'/g, "''");
  const escapedRole = role.replace(/'/g, "''");
  const escapedTerritory = territory ? `'${territory.replace(/'/g, "''")}'` : 'NULL';
  const escapedDirectorEmail = assignedDirectorEmail ? assignedDirectorEmail.toLowerCase().replace(/'/g, "''") : null;
  const assignedDirectorId = escapedDirectorEmail ? `(SELECT id FROM users WHERE lower(email) = '${escapedDirectorEmail}' LIMIT 1)` : 'NULL';
  const hash = credentialHash('9999').replace(/'/g, "''");

  return `
    INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, failed_credential_attempts, locked_until, created_at, updated_at)
    VALUES ('${escapedName}', '${escapedEmail}', '${escapedRole}', ${escapedTerritory}, ${assignedDirectorId}, '${hash}', false, 'ACTIVE', 0, NULL, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      territory = EXCLUDED.territory,
      assigned_director_id = EXCLUDED.assigned_director_id,
      credential_hash = EXCLUDED.credential_hash,
      must_change_credential = false,
      status = 'ACTIVE',
      failed_credential_attempts = 0,
      locked_until = NULL,
      updated_at = NOW();
  `;
}

exports.up = (pgm) => {
  const users = [
    { name: 'TUF Test Director', email: 'test.director@tufsports.us', role: 'DIRECTOR', territory: 'National', assignedDirectorEmail: null },
    { name: 'TUF Test Director West', email: 'test.director.west@tufsports.us', role: 'DIRECTOR', territory: 'West', assignedDirectorEmail: null },
    { name: 'TUF Test Rep', email: 'test.rep@tufsports.us', role: 'REP', territory: 'National', assignedDirectorEmail: 'test.director@tufsports.us' },
  ];

  users.forEach((user) => pgm.sql(upsertUserSql(user)));
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM users
    WHERE lower(email) IN ('test.rep@tufsports.us', 'test.director@tufsports.us', 'test.director.west@tufsports.us');
  `);
};
