exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('channel_type', ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN']);

  pgm.addColumn('opportunities', {
    channel_type: { type: 'channel_type', notNull: true },
  });

  pgm.addConstraint('opportunities', 'opportunities_organization_id_channel_type_key', {
    unique: ['organization_id', 'channel_type'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('opportunities', 'opportunities_organization_id_channel_type_key');
  pgm.dropColumn('opportunities', 'channel_type');
  pgm.dropType('channel_type');
};
