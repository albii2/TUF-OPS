
exports.up = (pgm) => {
    pgm.createTable('production_requests', {
        id: 'id',
        opportunity_id: {
            type: 'integer',
            notNull: true,
            references: 'opportunities(id)',
            onDelete: 'CASCADE',
        },
        type: {
            type: 'varchar(255)',
            notNull: true,
            check: "type IN ('MOCKUP', 'SAMPLE')",
        },
        status: {
            type: 'varchar(255)',
            notNull: true,
            check: "status IN ('REQUESTED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED')",
        },
        requested_by: {
            type: 'integer',
            notNull: true,
        },
        assigned_to: {
            type: 'integer',
        },
        title: {
            type: 'varchar(255)',
            notNull: true,
        },
        description: {
            type: 'text',
        },
        revision_count: {
            type: 'integer',
            default: 0,
        },
        external_url: {
            type: 'varchar(255)',
        },
        requested_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp'),
        },
        started_at: {
            type: 'timestamp',
        },
        completed_at: {
            type: 'timestamp',
        },
        delivered_at: {
            type: 'timestamp',
        },
        approved_at: {
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
        sample_cost: {
            type: 'decimal(10, 2)',
        },
        sample_charge_to_customer: {
            type: 'boolean',
            default: true,
        },
        sample_waived_by_rep: {
            type: 'boolean',
            default: false,
        },
        waiver_reason: {
            type: 'text',
        },
        waiver_approved_by: {
            type: 'integer',
        },
        waiver_approved_at: {
            type: 'timestamp',
        },
        shipping_status: {
            type: 'varchar(255)',
        },
        tracking_number: {
            type: 'varchar(255)',
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable('production_requests');
};
