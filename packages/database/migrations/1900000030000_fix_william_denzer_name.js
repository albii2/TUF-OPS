exports.up = async (pgm) => {
  // Fix William Denzer's name (was incorrectly entered as Menzel)
  await pgm.db.query(
    "UPDATE users SET name = 'William Denzer', email = 'wdenzer79@yahoo.com' WHERE id = 58"
  );
};

exports.down = async () => {
  throw new Error('Irreversible migration');
};
