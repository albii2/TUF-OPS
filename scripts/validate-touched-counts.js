const { AUDITABLE_TOUCH_TYPES = 'CALL,EMAIL,TEXT,MEETING,NOTE,OPPORTUNITY_ACTIVITY,LOGGED_CONTACT' } = process.env;

const touchTypes = AUDITABLE_TOUCH_TYPES.split(',').map((value) => value.trim()).filter(Boolean);

function calculateCoverage(organizations, activities) {
  const assignedIds = new Set(organizations.map((organization) => organization.id));
  const touchedIds = new Set(
    activities
      .filter((activity) => assignedIds.has(activity.organization_id))
      .filter((activity) => touchTypes.includes(String(activity.type).toUpperCase()))
      .map((activity) => activity.organization_id),
  );

  return {
    assigned: assignedIds.size,
    touched: touchedIds.size,
    untouched: assignedIds.size - touchedIds.size,
  };
}

const result = calculateCoverage(
  [{ id: 1 }, { id: 2 }, { id: 3 }],
  [
    { organization_id: 1, type: 'CALL' },
    { organization_id: 2, type: 'TASK' },
  ],
);

if (result.assigned !== 3 || result.touched !== 1 || result.untouched !== 2) {
  throw new Error(`Coverage validation failed: ${JSON.stringify(result)}`);
}

console.log(`Coverage validation passed: ${JSON.stringify(result)}`);
