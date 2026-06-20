# v0.9.0 Dashboard SQL Verification

Run these as read-only spot checks after deployment. Replace `$1` with a rep id or director id where scoped checks are needed.

```sql
-- Assigned schools by rep
SELECT COUNT(*) FROM organizations WHERE assigned_rep_id = $1;

-- Touched schools by rep
SELECT COUNT(DISTINCT a.organization_id)
FROM activities a
JOIN organizations org ON org.id = a.organization_id
WHERE org.assigned_rep_id = $1
  AND UPPER(a.type) IN ('CALL','EMAIL','TEXT','MEETING','NOTE','OPPORTUNITY_ACTIVITY','LOGGED_CONTACT');

-- Untouched schools by rep
WITH assigned AS (SELECT id FROM organizations WHERE assigned_rep_id = $1),
touched AS (
  SELECT DISTINCT a.organization_id FROM activities a JOIN assigned s ON s.id = a.organization_id
  WHERE UPPER(a.type) IN ('CALL','EMAIL','TEXT','MEETING','NOTE','OPPORTUNITY_ACTIVITY','LOGGED_CONTACT')
)
SELECT COUNT(*) FROM assigned a LEFT JOIN touched t ON t.organization_id = a.id WHERE t.organization_id IS NULL;

-- Active opportunities
SELECT COUNT(*) FROM opportunities o JOIN organizations org ON org.id = o.organization_id
WHERE org.assigned_rep_id = $1 AND o.stage NOT IN ('CLOSED_WON','CLOSED_LOST');

-- Follow-ups due
SELECT COUNT(*) FROM activities a JOIN organizations org ON org.id = a.organization_id
WHERE org.assigned_rep_id = $1 AND a.completed = false AND a.due_date <= NOW();

-- Closed won
SELECT COUNT(*) FROM opportunities o JOIN organizations org ON org.id = o.organization_id
WHERE org.assigned_rep_id = $1 AND o.stage = 'CLOSED_WON';

-- Paid orders, paid revenue, gross profit, rep commission
SELECT COUNT(*) AS paid_orders,
       COALESCE(SUM(o.actual_revenue), 0) AS paid_revenue,
       COALESCE(SUM(o.gross_profit), 0) AS gross_profit,
       COALESCE(SUM(c.rep_commission), 0) AS rep_commission
FROM orders ord
JOIN opportunities o ON o.id = ord.opportunity_id
LEFT JOIN commissions c ON c.opportunity_id = o.id
WHERE ord.assigned_rep_id = $1 AND ord.status IN ('DELIVERED','COMPLETED');

-- Director override
SELECT COALESCE(SUM(c.director_override), 0) AS director_override
FROM orders ord
JOIN opportunities o ON o.id = ord.opportunity_id
LEFT JOIN commissions c ON c.opportunity_id = o.id
WHERE ord.assigned_director_id = $1 AND ord.status IN ('DELIVERED','COMPLETED');
```
