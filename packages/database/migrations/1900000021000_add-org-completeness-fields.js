exports.up = (pgm) => {
  pgm.addColumns('organizations', {
    sport: { type: 'varchar(100)' },
    address: { type: 'varchar(500)' },
    team_colors: { type: 'varchar(255)' },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('organizations', ['sport', 'address', 'team_colors'], { ifExists: true });
};
