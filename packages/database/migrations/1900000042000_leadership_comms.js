export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS leadership_comms (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      recipient TEXT NOT NULL,
      recipient_role TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_for TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      delivery_channel TEXT DEFAULT 'email',
      tags TEXT[] DEFAULT '{}',
      ai_draft TEXT,
      notes TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      updated_by INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leadership_comm_recipients (
      id SERIAL PRIMARY KEY,
      comm_id INTEGER NOT NULL REFERENCES leadership_comms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_leadership_comms_status ON leadership_comms(status);
    CREATE INDEX IF NOT EXISTS idx_leadership_comms_recipient ON leadership_comms(recipient);
    CREATE INDEX IF NOT EXISTS idx_leadership_comms_scheduled ON leadership_comms(scheduled_for)
      WHERE status = 'scheduled';
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS leadership_comm_recipients;
    DROP TABLE IF EXISTS leadership_comms;
  `);
}
