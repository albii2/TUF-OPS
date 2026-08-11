import { roleConfig } from '../src/config/roles';
import { dashboardCtaContract } from '../src/config/roleSmokeContract';
let failed = false;
for (const role of Object.keys(roleConfig)) {
    const visibleRoutes = roleConfig[role].visiblePages;
    const ctas = dashboardCtaContract[role];
    if (!ctas || ctas.length !== 4) {
        console.error(`[FAIL] ${role} dashboard CTA contract missing or invalid`);
        failed = true;
        continue;
    }
    for (const cta of ctas) {
        if (!visibleRoutes.includes(cta.to)) {
            console.error(`[FAIL] ${role} CTA "${cta.label}" points to inaccessible route: ${cta.to}`);
            failed = true;
        }
    }
}
if (failed)
    process.exit(1);
console.log('Role CTA route contract passed for OWNER/DIRECTOR/REP/OPS.');
//# sourceMappingURL=role-smoke-check.js.map