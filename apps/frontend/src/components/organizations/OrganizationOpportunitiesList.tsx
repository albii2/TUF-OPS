import Link from 'next/link';
import { Opportunity as PrismaOpportunity, OpportunityStage } from '@prisma/client';
import { StageBadge } from '@/components/opportunities/StageBadge';

type OpportunityWithNumberValue = Omit<PrismaOpportunity, 'estimated_value'> & {
  estimated_value: number;
};

function OpportunityRow({ opportunity }: { opportunity: OpportunityWithNumberValue }) {
    const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(opportunity.estimated_value);

    return (
        <Link href={`/opportunities/${opportunity.id}`} className="block p-3 hover:bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 font-semibold">
                    {opportunity.name}
                </div>
                <div className="col-span-1">
                    <StageBadge stage={opportunity.stage} />
                </div>
                <div className="col-span-1 text-right font-mono text-sm">
                    {formattedValue}
                </div>
            </div>
        </Link>
    );
}

export function OrganizationOpportunitiesList({ opportunities }: { opportunities: OpportunityWithNumberValue[] }) {
    if (opportunities.length === 0) {
        return <p className="text-sm text-muted-foreground">No opportunities are linked to this organization.</p>
    }

    return (
        <div className="space-y-2">
            {opportunities.map(opp => (
                <OpportunityRow key={opp.id} opportunity={opp} />
            ))}
        </div>
    );
}
