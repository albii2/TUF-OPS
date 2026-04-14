import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type OpportunityStage } from '@prisma/client';

type SnapshotData = {
    stage: OpportunityStage;
    _count: { stage: number };
    _sum: { estimated_value: number | null };
}

interface PipelineSnapshotPanelProps {
    data: SnapshotData[];
}

function formatStageName(stage: string) {
    return stage.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

export function PipelineSnapshotPanel({ data }: PipelineSnapshotPanelProps) {
    return (
        <Card>
            <CardHeader><CardTitle>Pipeline Snapshot</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map(item => (
                        <div key={item.stage} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{formatStageName(item.stage)}</p>
                                <p className="text-sm text-muted-foreground">{item._count.stage} opportunities</p>
                            </div>
                            <p className="font-semibold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item._sum.estimated_value || 0)}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
