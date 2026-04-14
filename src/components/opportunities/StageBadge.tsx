import { OpportunityStage } from '@prisma/client';

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  const map: Record<OpportunityStage, { label: string, className: string }> = {
    lead: { label: 'Lead', className: 'bg-gray-500 text-white' },
    contacted: { label: 'Contacted', className: 'bg-blue-500 text-white' },
    mockup: { label: 'Mockup', className: 'bg-purple-500 text-white' },
    sample: { label: 'Sample', className: 'bg-orange-500 text-white' },
    invoice: { label: 'Invoice', className: 'bg-yellow-500 text-black' },
    closed_won: { label: 'Closed Won', className: 'bg-green-600 text-white' },
    closed_lost: { label: 'Closed Lost', className: 'bg-red-600 text-white' },
  };

  const { label, className } = map[stage] || { label: 'Unknown', className: 'bg-gray-200 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  );
}
