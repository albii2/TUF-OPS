exports.up = async (pgm) => {
  const baseWhere = `(
    assigned_rep_name IN ('Shayla Hilliard', 'Jason Mulder', 'David Lundberg')
    OR assigned_rep_id IN (43, 44, 45)
    OR assigned_rep_name IS NULL
    OR assigned_rep_name = 'Unassigned'
  )`;

  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'Ryan Streetar', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere}
    AND (city IN ('Minneapolis','Saint Paul','St. Paul','St Paul','Paul','Brooklyn Center','Brooklyn Park','Golden Valley','Richfield','Fridley','New Hope','Mendota Heights','Inver Grove Heights','Minnetonka','Plymouth','Maple Grove','St. Louis Park','Louis Park','St. Anthony Village','Anthony Village','Columbia Heights','Crystal','Robbinsdale','Edina','Bloomington','Roseville','Falcon Heights','Hopkins','Eden Prairie','Shoreview','Little Canada','Maplewood','Oakdale','Woodbury','Cottage Grove','Lake Elmo','White Bear Lake','Arden Hills','New Brighton','Mounds View','Spring Lake Park','North Oaks','Vadnais Heights','Mahtomedi','Stillwater')
      OR name ILIKE '%Minneapolis%' OR name ILIKE '%St.%Paul%' OR name ILIKE '%St Paul%')
  `);

  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'Primeau Hill', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere} AND assigned_rep_name IS NULL
    AND (city IN ('Braham','Cambridge','Princeton','Zimmerman','Mora','Pine City','Hinckley','Rush City','North Branch','Isanti','Forest Lake','Hugo','Lino Lakes','Anoka','Andover','Blaine','Coon Rapids','Champlin','Elk River','Big Lake','Monticello','Buffalo','Rogers','Otsego','Ramsey','Ham Lake','Wyoming','Chisago City','Lindstrom','Milaca','Sandstone','Alexandria','Sauk Centre','Melrose','Albany','St. Cloud','Sartell','Sauk Rapids','Willmar','Benson','Morris','Little Falls','Long Prairie','Staples','Wadena','Park Rapids','Detroit Lakes','Fergus Falls','Perham','Brainerd','Baxter','Pequot Lakes','Grand Rapids','Hibbing','Virginia','Duluth','Hermantown','Proctor','Cloquet','Esko','Two Harbors','International Falls','Bemidji','Thief River Falls','Crookston','East Grand Forks','Roseau','Warroad','Moorhead','Dilworth','Barnesville','Hawley','Frazee')
      OR city ILIKE '%Rapids%' OR city ILIKE '%Falls%' OR name ILIKE '%North%' OR name ILIKE '%Northern%' OR name ILIKE '%Duluth%')
  `);

  await pgm.db.query(`
    UPDATE organizations SET assigned_rep_name = 'William Denzer', assigned_rep_id = NULL, updated_at = NOW()
    WHERE ${baseWhere} AND assigned_rep_name IS NULL
  `);
};
exports.down = async () => { throw new Error('Irreversible'); };
