
exports.up = (pgm) => {
    pgm.createTable('orders', {
        id: 'id',
        opportunity_id: {
            type: 'integer',
            notNull: true,
            references: 'opportunities(id)',
            onDelete: 'CASCADE',
        },
        organization_id: {
            type: 'integer',
            notNull: true,
            references: 'organizations(id)',
            onDelete: 'CASCADE',
        },
        deal_type: {
            type: 'varchar(255)',
            notNull: true,
        },
        status: {
            type: 'varchar(255)',
            notNull: true,
            check: "status IN ('CREATED', 'IN_PRODUCTION', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED')",
        },
        assigned_rep_id: {
            type: 'integer',
        },
        assigned_director_id: {
            type: 'integer',
        },
        vendor_id: {
            type: 'integer',
        },
        production_notes: {
            type: 'text',
        },
        tracking_info: {
            type: 'jsonb',
        },
        delivery_date: {
            type: 'timestamp',
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.addConstraint('orders', 'orders_opportunity_id_unique', { unique: ['opportunity_id'] });
};

exports.down = (pgm) => {
    pgm.dropTable('orders');
};
