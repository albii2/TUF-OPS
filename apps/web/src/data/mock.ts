export const lanes = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];

export const opportunityStages = [
  'LEAD_ASSIGNED',
  'CONTACTED',
  'DISCOVERY',
  'MOCKUP_REQUESTED',
  'MOCKUP_DELIVERED',
  'INVOICE_SENT',
  'DECISION_PENDING',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

export const nextActions = [
  { name: 'Northview Academy', action: 'Call AD re: invoice questions', due: '10:30 AM' },
  { name: 'Cedar Hill', action: 'Text coach with mockup update', due: '12:00 PM' },
  { name: 'Liberty Prep', action: 'Email proposal revision', due: '2:15 PM' },
];
