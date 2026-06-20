const trainingContentSeed = require('./1900000005000_seed_training_modules');

exports.up = (pgm) => {
  // Re-run the idempotent v0.9 Academy content upsert for environments where
  // 1900000005000 already ran before the launch-ready curriculum was added.
  trainingContentSeed.up(pgm);
};

exports.down = () => {
  // Intentionally no-op: do not delete Academy content or disrupt learner progress.
};
