exports.up = async (pgm) => {
  // Reassign 119 departed (Shayla + Jason) + unassigned leads by geography
  // Target: only orgs assigned to departed reps or unassigned

  const baseWhere = `(assigned_rep_name IN ('Shayla Hilliard', 'Jason Mulder') OR assigned_rep_id = 45 OR assigned_rep_id = 46 OR assigned_rep_name IS NULL OR assigned_rep_name = 'Unassigned')`;

  // ── Ryan Streetar: Minneapolis Metro + St. Paul ──
  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'Ryan Streetar', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere}
    AND (city IN ('Minneapolis', 'Saint Paul', 'St. Paul', 'St Paul', 'Paul',
                  'Brooklyn Center', 'Brooklyn Park', 'Golden Valley', 'Richfield',
                  'Fridley', 'New Hope', 'Mendota Heights', 'Inver Grove Heights',
                  'Minnetonka', 'Plymouth', 'Maple Grove', 'St. Louis Park',
                  'Louis Park', 'St. Anthony Village', 'Anthony Village',
                  'Columbia Heights', 'Crystal', 'Robbinsdale', 'Edina',
                  'Bloomington', 'Roseville', 'Falcon Heights', 'Lauderdale',
                  'Hopkins', 'Eden Prairie', 'Edina')
      OR name ILIKE '%Minneapolis%' OR name ILIKE '%St. Paul%' OR name ILIKE '%St Paul%'
      OR name ILIKE '%Twin Cities%' OR city ILIKE '%Paul%')
  `);

  // ── Primeau Hill: Metro North + Northeast Metro + Central MN ──
  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'Primeau Hill', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere}
    AND assigned_rep_name IS NULL  -- not already assigned to Ryan
    AND (city IN ('Braham', 'Cambridge', 'Princeton', 'Zimmerman', 'Mora', 'Pine City',
                  'Hinckley', 'Rush City', 'North Branch', 'Isanti', 'Forest Lake',
                  'Stillwater', 'White Bear Lake', 'Hugo', 'Lino Lakes', 'Shoreview',
                  'Vadnais Heights', 'Little Canada', 'Maplewood', 'Oakdale',
                  'Woodbury', 'Cottage Grove', 'Lake Elmo', 'Mahtomedi',
                  'Anoka', 'Andover', 'Blaine', 'Coon Rapids', 'Champlin',
                  'Elk River', 'Big Lake', 'Monticello', 'Buffalo', 'Rogers',
                  'Otsego', 'Ramsey', 'Ham Lake', 'East Bethel')
      OR name ILIKE '%Northern%' OR name ILIKE '%North Branch%')
  `);

  // ── William Denzer: South + West MN ──
  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'William Denzer', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere}
    AND assigned_rep_name IS NULL  -- not already assigned
    AND (city IN ('Albert Lea', 'Austin', 'Rochester', 'Mankato', 'Owatonna', 'Faribault',
                  'Winona', 'Fairmont', 'New Ulm', 'Waseca', 'Worthington', 'Luverne',
                  'Pipestone', 'Windom', 'Blue Earth', 'Jackson', 'Marshall',
                  'Willmar', 'Montevideo', 'Redwood Falls', 'Hutchinson', 'Litchfield',
                  'Belle Plaine', 'LeSueur', 'New Prague', 'Waconia', 'Watertown',
                  'Glencoe', 'Howard Lake', 'Norwood Young America', 'Glencoe',
                  'Cannon Falls', 'Red Wing', 'Northfield', 'Lakeville', 'Farmington',
                  'Apple Valley', 'Burnsville', 'Rosemount', 'Eagan', 'Savage',
                  'Shakopee', 'Prior Lake', 'Chaska', 'Chanhassen', 'Victoria',
                  'Byron', 'Kasson', 'Stewartville', 'Caledonia', 'La Crescent',
                  'Chatfield', 'Dover', 'Eyota', 'St. Charles', 'Plainview',
                  'Lake City', 'Goodhue', 'Kenyon', 'Pine Island', 'Triton',
                  'Medford', 'Blooming Prairie', 'Janesville', 'Waterville',
                  'St. Peter', 'St. Clair', 'Mapleton', 'Lake Crystal',
                  'New Richland', 'Waseca', 'Montgomery', 'Tri-City',
                  'Arlington', 'Sibley East', 'Randolph', 'Cannon Falls')
      OR city ILIKE '%Rochester%' OR city ILIKE '%Mankato%'
      OR name ILIKE '%Southern%' OR name ILIKE '%South%' OR name ILIKE '%West%')
  `);

  // ── Any remaining → William Denzer (largest territory) ──
  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'William Denzer', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere}
    AND assigned_rep_name IS NULL
  `);
};

exports.down = async () => {
  throw new Error('Irreversible migration');
};
