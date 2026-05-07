exports.up = pgm => {
  pgm.createTable('creative_requests', {
    id: 'id',
    opportunity_id: { type: 'integer', notNull: true, references: 'opportunities', onDelete: 'cascade' },
    organization_id: { type: 'integer', references: 'organizations', onDelete: 'set null' },
    created_by_user_id: { type: 'integer', notNull: true },
    assigned_designer_id: { type: 'integer' },
    request_type: { type: 'varchar(64)', notNull: true },
    design_team: { type: 'varchar(64)', notNull: true },
    priority: { type: 'varchar(32)', notNull: true, default: 'NORMAL' },
    title: { type: 'varchar(255)', notNull: true },
    sport: { type: 'varchar(64)' },
    season: { type: 'varchar(64)' },
    needed_items: { type: 'jsonb', notNull: true, default: '[]' },
    design_notes: { type: 'text', notNull: true },
    inspiration_notes: { type: 'text' },
    due_date: { type: 'date' },
    asset_links: { type: 'text' },
    internal_notes: { type: 'text' },
    status: { type: 'varchar(64)', notNull: true, default: 'SUBMITTED' },
    trello_card_id: { type: 'varchar(255)' },
    trello_card_url: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('creative_requests', ['opportunity_id']);
};

exports.down = pgm => {
  pgm.dropTable('creative_requests');
};
