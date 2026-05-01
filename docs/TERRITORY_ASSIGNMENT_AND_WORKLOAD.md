# Territory Assignment and Rep Workload

## Purpose
Enable Owner and Director users to turn territory/account data into clear rep workloads by assignment, coverage, and pipeline pressure in mock mode.

## Role Permissions
- **Owner**: bulk assign any scoped organizations (territory/director/rep/coverage), view all zones and all rep workloads.
- **Director**: bulk assign within scoped organizations, view only their assigned territory zones and workload rows.
- **Rep**: no bulk assignment controls; assigned-data only.

## Bulk Assignment Workflow
1. Filter organizations by territory/rep/director/coverage/priority.
2. Select individual rows or select all visible rows.
3. Apply bulk action:
   - Assign Territory
   - Assign Director
   - Assign Rep
   - Set Coverage Status
4. Review mock summary message and clear selection.

## Workload Balancing Logic
Rep workload panel shows:
- Assigned accounts
- Untouched accounts
- Active opportunities
- Near-close opportunities
- Stuck opportunities
- Closed Won MTD
- Pipeline value

## Assignment Health Definitions
- **Underassigned**: fewer than 15 assigned accounts.
- **Balanced**: 15–35 assigned accounts.
- **Overloaded**: more than 35 assigned accounts.

## Beta Testing Checklist
- Owner can see all territory cards and all rep workload rows.
- Director can only see scoped territories/workload rows.
- Rep cannot see bulk assignment controls on Organizations page.
- Organizations filters preserve search + pagination behavior.
- Bulk actions show selection and summary feedback.
- No runtime errors in `/organizations` and `/territory`.
