exports.up = pgm => {
  pgm.createTable('announcements', {
    id: 'id',
    sender_id: { type: 'varchar(255)', notNull: true },
    sender_name: { type: 'varchar(255)', notNull: true },
    sender_role: { type: 'varchar(64)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true },
    importance: { type: 'varchar(32)', notNull: true, default: 'NORMAL' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('announcements', ['created_at']);
};

exports.down = pgm => {
  pgm.dropTable('announcements');
};
