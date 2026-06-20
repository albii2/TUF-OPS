const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

const servicePath = 'apps/api/src/modules/reporting/reporting.service.ts';
const controllerPath = 'apps/api/src/modules/reporting/reporting.controller.ts';
const routesPath = 'apps/api/src/modules/reporting/reporting.routes.ts';
const dashboardPath = 'apps/web/src/pages/DashboardPage.tsx';
const dashboardServicePath = 'apps/web/src/services/dashboardMetricsService.ts';
const dashboardHookPath = 'apps/web/src/hooks/useDashboardMetrics.ts';

check(exists(servicePath), 'reporting service is missing');
check(exists(controllerPath), 'reporting controller is missing');
check(exists(routesPath), 'reporting routes are missing');
check(exists(dashboardServicePath), 'frontend dashboard metrics service is missing');
check(exists(dashboardHookPath), 'frontend dashboard metrics hook is missing');
check(exists('docs/V0_9_0_DASHBOARD_DATA_CONTRACT.md'), 'dashboard data contract doc is missing');
check(exists('docs/V0_9_0_DASHBOARD_SQL_VERIFICATION.md'), 'dashboard SQL verification doc is missing');

const service = exists(servicePath) ? read(servicePath) : '';
const controller = exists(controllerPath) ? read(controllerPath) : '';
const routes = exists(routesPath) ? read(routesPath) : '';
const dashboard = exists(dashboardPath) ? read(dashboardPath) : '';
const frontendService = exists(dashboardServicePath) ? read(dashboardServicePath) : '';
const dashboardHook = exists(dashboardHookPath) ? read(dashboardHookPath) : '';
const opportunitiesService = exists('apps/api/src/modules/opportunities/opportunities.service.ts') ? read('apps/api/src/modules/opportunities/opportunities.service.ts') : '';

for (const metric of [
  'assigned_schools', 'touched_schools', 'untouched_schools', 'active_opportunities',
  'follow_ups_due', 'action_needed_items', 'closed_won_count', 'paid_order_count',
  'paid_revenue', 'gross_profit', 'rep_commission_estimate', 'director_override_estimate',
  'month_to_date_activity'
]) {
  check(service.includes(metric), `reporting service missing ${metric}`);
  check(frontendService.includes(metric), `frontend dashboard service missing ${metric}`);
}

for (const route of ['owner-dashboard', 'admin-dashboard', 'director-dashboard/:directorId', 'rep-dashboard/:repId', 'director-dashboard-by-email', 'rep-dashboard-by-email', 'school-coverage', 'commissions']) {
  check(routes.includes(route), `reporting route missing ${route}`);
}

check(controller.includes('TODO(v0.9 auth hardening)'), 'reporting controller must document current auth/id-scope blocker');
check(service.includes("scope.commissionVisibility === 'director' ? 0"), 'director dashboard must suppress rep commission estimates');
check(service.includes("scope.commissionVisibility === 'rep' ? 0"), 'rep dashboard must suppress director override estimates');
check(service.includes("'DELIVERED', 'COMPLETED'"), 'commission metrics must be payment/delivery gated');
check(dashboard.includes('useDashboardMetrics'), 'DashboardPage must call backend dashboard metrics hook');
check(frontendService.includes('director-dashboard-by-email') && frontendService.includes('rep-dashboard-by-email'), 'frontend dashboard service must map local string ids through email fallback endpoints');
check(dashboardHook.includes('userEmail') && dashboard.includes('currentUser?.email'), 'dashboard hook/page must pass stored user email for API id resolution');
check(service.includes('COALESCE(ord.assigned_rep_id, o.assigned_rep_id)') && service.includes('COALESCE(ord.assigned_director_id, o.assigned_director_id)'), 'order revenue metrics must scope through order assignment fallback to opportunity assignment');
check(opportunitiesService.includes('assigned_rep_id, assigned_director_id') && opportunitiesService.includes('updatedOpp.assigned_rep_id'), 'Closed Won auto-order creation must copy rep/director assignment');
check(dashboard.includes('isApiBacked ? backendMetrics'), 'DashboardPage launch-critical cards must prefer backend metrics in API mode');
check(dashboard.includes('orderPaceCount'), '4-orders/month pacing must be tied to backend paid order count in API mode');
check(!/estimatedEarnings = .*0\.1; \/\/ 10% commission mock\n[\s\S]*formatCurrency\(estimatedEarnings\)/.test(dashboard), 'estimated earnings mock value is directly rendered without API-backed override');

if (errors.length) {
  console.error('Dashboard wiring validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Dashboard wiring validation passed.');
