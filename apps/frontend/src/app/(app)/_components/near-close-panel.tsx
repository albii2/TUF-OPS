import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NearCloseData = {
    id: number;
    name: string;
    estimated_value: any;
    program: { name: string };
}

interface NearClosePanelProps {
    opportunities: NearCloseData[];
}

export function NearClosePanel({ opportunities }: NearClosePanelProps) {
    return (
        <Card>
            <CardHeader><CardTitle>Near Close</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {opportunities.map(opp => (
                        <div key={opp.id} className="flex justify-between items-center">
                            <div>
                                <Link href={`/opportunities/${opp.id}`} className="font-medium hover:underline">
                                    {opp.name}
                                </Link>
                                <p className="text-sm text-muted-foreground">{opp.program.name}</p>
                            </div>
                            <p className="font-semibold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(opp.estimated_value || 0)}
                            </p>
                        </div>
                    ))}
                     {opportunities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No opportunities are in the final stages.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
