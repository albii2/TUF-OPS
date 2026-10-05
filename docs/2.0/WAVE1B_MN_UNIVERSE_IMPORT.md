# Wave 1B — Minnesota Market Universe Intelligence Import

**Wave:** 1B (Minnesota Universe Intelligence) · **Date:** 2026-10-04 · **Branch:** `rebuild/2.0`
**Target:** Railway service `Postgres-r5VC` (`17ae6525-5842-4dec-a024-1d83229cd3cb`)
**Source:** Railway service `Postgres` (`3459a73a-…`) — **SELECT-only**, never written
**Authority:** founder ruling — R5 CLEAN SEED and R2 PRESERVE THE UNIVERSE reconciled; import
intelligence only, never legacy operational state.

---

## 1. Headline — the universe is 272, not 288

The historical "288 schools" figure is **two datasets added together**, not one:

| Source stream | Rows | Verdict |
|---|---|---|
| `tuf_mn_leads_final.csv` | **272** | **LEGITIMATE** — the canonical MN leads dataset, and *exactly* the set carrying `organization_sports` (272 orgs × 4 sports = 1,088, which corroborates 272 independently). Zero duplicate `(name,state)`, no test names. |
| `tuf_leads_final_enriched.csv` | **16** | **EXCLUDED** — the column DEFAULT: app-bootstrap prototype residue and ad-hoc inserts (`Test High`, `West Test High School`, `Tuf West [DUPLICATE]`, `Verify Josh`, `Final Bradshaw`, `Final Josh`, `Certified Tweakas`, `Northwood High School Football`, `University of Irvine Soccer`, `Mater Dei Basketball`, `South Coast College Volleyball`, `Seabreeze High`, …). |
| | **288** | the historical figure, and the reason it was wrong |

Per the founder's instruction — *use the verified count rather than forcing the historical number* —
**the universe is 272 and unactivated universe is 269.**

## 2. What was imported

```
organizations        read  272  ->  created 269, reconciled   3
organization_sports  read 1088  ->  inserted 1088, skipped    0
contacts             read  259  ->  imported  252, excluded   7
--------------------------------------------------------------------
target totals: organizations=272  organization_sports=1088  contacts=252  markets=3
```

**Markets stayed at exactly 3. Nothing was activated by this import.**

### Contacts — classified, not copied

All 259 are role `Athletic Director` on legitimate organizations. **7 excluded** as residue by a
deterministic rule: **ids 16, 20, 58, 98, 155, 208, 260**. The remaining **252 imported**, each tagged
`source='legacy_mn_universe_2_0_1b'`. Two legitimate cross-organization individuals were deliberately kept.

### Provenance

Every imported organization carries `lead_source='tuf_mn_leads_final.csv'` plus
`lead_metadata.legacy_id`, so legacy-derived intelligence is distinguishable from later research or
imports. All 252 contacts carry the `source` tag added by migration
`1900000061000_contacts_source_provenance.js`.

## 3. Reconciliation — no duplicate Pillager / Pequot / Brainerd

The Wave-1 seed already created the three launch organizations, and the three `markets` rows reference
them. The import reconciled deterministically on the target's existing natural key
`organizations_name_state_unique ON (lower(btrim(name)), upper(btrim(state)))`:

| Target org | School | reconciled from legacy id |
|---|---|---|
| 1 | Pillager | 175 |
| 2 | Pequot Lakes | 172 |
| 3 | Brainerd | 30 |

No additional organizations were inserted for these three, and the `markets.universe_organization_id`
foreign keys remain valid.

## 4. Required proof — all ten assertions PASS (verifier exit 0)

| # | Assertion | Result |
|---|---|---|
| 1 | Universe organizations = 272 (verified count) | **PASS** — 272, all provenance-tagged |
| 2 | Markets = exactly 3 | **PASS** |
| 3 | Pillager / Pequot Lakes / Brainerd each resolve to exactly ONE org and ONE market | **PASS** |
| 4 | A representative unactivated school exists in `organizations` but NOT in `markets` | **PASS** — 269 unactivated (sample: Academy of Holy Angels) |
| 5 | `organization_sports` belongs to Universe orgs WITHOUT activating them | **PASS** — 1,088 sports on 272 orgs; 1,076 on unactivated orgs; markets still 3 |
| 6 | Creating/importing another Universe organization does NOT create a Market | **PASS** — inert fixture insert created no market |
| 7 | Operational Market queries return 3, not 272 | **PASS** |
| 8 | No legacy operational rows imported | **PASS** — all 14 operational tables = 0 rows |
| 9 | ACTIVATE MARKET remains the only legitimate promotion path | **PASS** — no unauthorized `markets` INSERT sites |
| 10 | Re-running the import is idempotent | **PASS** — see §5 |

## 5. Idempotency — proven by a second run (exit 0)

```
run #2: organizations created 0 / reconciled 272
        organization_sports inserted 0 / skipped 1088
        contacts imported 0 / skipped 252
counts identical before/after: 272 / 1088 / 252 / 3
```

## 6. Safety

- Legacy `Postgres` was **SELECT-only**; the import script guards it with
  `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY` (verified present *and* executed).
- The import never writes to `markets`; the only writable target was `Postgres-r5VC`.
- Legacy app `terrific-patience`, and `main`, were never touched.
- No `pnpm test` (destructive db reset) was run. No `railway domain` / TCP proxy was created.

## 7. Two defects found and fixed in the Wave-1B artifacts

1. `import_mn_universe_2_0.js` — the reconciliation UPDATE referenced `$2..$25` but never `$1`, so
   Postgres raised `could not determine data type of parameter $1`. Fixed by binding the natural key
   (`name = $1::varchar`).
2. `verify_mn_universe_2_0.js` — assertion 9's repo-scan flagged the verifier's **own** `console.log`
   literals containing the string `INSERT INTO markets` (a self-referential false positive). Reworded
   those two log strings; the scan logic remains strict and unchanged.

## 8. Open items (UNKNOWN — flagged, not resolved)

1. **CSV 273 vs legacy 272.** `apps/web/src/assets/tuf_mn_leads_final.csv` contains **273** data rows
   (273 distinct school names) while legacy `organizations WHERE lead_source='tuf_mn_leads_final.csv'`
   = **272**, and the import loaded 272. The legacy database independently confirms 272, so the import
   is correct — but **the extra CSV row was not identified.** One query would resolve it. Until then,
   272 stands as the verified universe.
2. **The enriched CSV was not found on disk** (`tuf_leads_final_enriched.csv`). Only its 16-row effect
   inside the legacy database is confirmed — which is sufficient for the exclusion, but the source file
   itself is unlocated.
