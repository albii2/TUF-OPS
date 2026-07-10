exports.up = async (pgm) => {
  // Fix William Denzer's name (was incorrectly entered as Menzel)
  await pgm.db.query(
    "UPDATE users SET name = 'William Denzer', email = 'william.denzer@tufsports.us' WHERE id = 58"
  );
};

exports.down = async () => {
  throw new Error('Irreversible migration');
};
