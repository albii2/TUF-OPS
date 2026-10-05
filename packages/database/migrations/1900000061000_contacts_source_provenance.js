/**
 * TUF Ops 2.0 — Wave 1B provenance migration.
 * =============================================================================
 *
 * The Minnesota Market Universe intelligence (`contacts`) carries NO source /
 * provenance column in the legacy schema (Postgres 18.6, service `Postgres`).
 * `organizations` already has `lead_source` (+ `lead_metadata`) and
 * `organization_sports` already has `source`, but `contacts` has none.
 *
 * The founder ruling for Wave 1B requires: "preserve provenance on imported
 * intelligence ... so legacy-derived intelligence is distinguishable from later
 * research/imports (e.g. a source column/marker)." This migration adds the
 * missing marker column so the Wave 1B import can satisfy that on contacts too.
 *
 * Forward-only, additive, and non-destructive:
 *   - the column is NULLABLE with no default, so every existing row is
 *     unaffected and existing behaviour is unchanged;
 *   - applying the migration creates NO rows.
 *
 * Semantics of `contacts.source`:
 *   NULL                    = provenance not yet classified (e.g. hand-created)
 *   'legacy_mn_universe_2_0_1b' = imported from the legacy MN Market Universe
 *                                 dataset by the Wave 1B intelligence import.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn(
    'contacts',
    { source: { type: 'varchar(64)' } },
    { ifNotExists: true },
  );

  pgm.sql(`
    COMMENT ON COLUMN contacts.source IS
      'Provenance of the contact intelligence. NULL = unclassified; legacy_mn_universe_2_0_1b = Wave 1B legacy MN universe import.'
  `);
};

exports.down = (pgm) => {
  pgm.dropColumn('contacts', 'source', { ifExists: true });
};
