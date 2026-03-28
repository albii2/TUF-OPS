import React from 'react';
import { Opportunity } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

type OpportunityFocusSectionProps = {
    dealsWithoutNextStep: Opportunity[];
    overdueDeals: Opportunity[];
    staleDeals: Opportunity[];
};

const FocusCard = ({ title, opportunities }: { title: string, opportunities: Opportunity[] }) => {
    if (opportunities.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title} ({opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {opportunities.map(opp => (
                        <li key={opp.id}>
                            <Link href={`/opportunities/${opp.id}`} className="hover:underline">
                                {opp.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

const OpportunityFocusSection: React.FC<OpportunityFocusSectionProps> = ({ 
    dealsWithoutNextStep, 
    overdueDeals, 
    staleDeals 
}) => {
    const hasFocusItems = dealsWithoutNextStep.length > 0 || overdueDeals.length > 0 || staleDeals.length > 0;

    if (!hasFocusItems) {
        return null; // Don't render the section if there's nothing to show
    }

  return (
    <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Focus</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FocusCard title="Needs Next Step" opportunities={dealsWithoutNextStep} />
            <FocusCard title="Overdue Next Step" opportunities={overdueDeals} />
            <FocusCard title="Stale Deals" opportunities={staleDeals} />
        </div>
    </div>
  );
};

export default OpportunityFocusSection;
