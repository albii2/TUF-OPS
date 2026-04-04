import React from 'react';
import { Opportunity } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { cn } from '@/lib/utils';

type OpportunityFocusSectionProps = {
    mustActToday: Opportunity[];
    atRisk: Opportunity[];
    missingNextStep: Opportunity[];
};

const FocusCard = ({ title, opportunities, className }: { title: string, opportunities: Opportunity[], className?: string }) => {
    if (opportunities.length === 0) return null;

    return (
        <Card className={cn(className)}>
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
    mustActToday, 
    atRisk, 
    missingNextStep 
}) => {
    const hasFocusItems = mustActToday.length > 0 || atRisk.length > 0 || missingNextStep.length > 0;

    if (!hasFocusItems) {
        return null;
    }

  return (
    <div className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FocusCard title="Must Act Today" opportunities={mustActToday} className="border-red-500" />
            <FocusCard title="At Risk" opportunities={atRisk} className="border-yellow-500" />
            <FocusCard title="Missing Next Step" opportunities={missingNextStep} className="border-yellow-500" />
        </div>
    </div>
  );
};

export default OpportunityFocusSection;
