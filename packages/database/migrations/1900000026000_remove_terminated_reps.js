// Remove terminated reps from database
exports.up = async (pgm) => {
  await pgm.db.query(
    "DELETE FROM users WHERE lower(email) IN ('jvmulder@gmail.com', 'shaylahilliard17@gmail.com')"
  );
};

exports.down = async (pgm) => {
  // Irreversible — no need to restore terminated users
};