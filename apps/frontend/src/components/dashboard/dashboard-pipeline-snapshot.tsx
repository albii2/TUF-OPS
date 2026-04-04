import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export function DashboardPipelineSnapshot({ snapshot }: { snapshot: any }) {
  const { totalOpportunities, totalValue, byStage } = snapshot;

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex justify-between font-bold border-b pb-2">
                <span>Total Value</span>
                <span>{formattedValue}</span>
            </div>
            {Object.entries(byStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{stage.replace('_', ' ')}</span>
                    <span className="font-semibold">{count as any}</span>
                </div>
            ))}
             <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Deals</span>
                <span>{totalOpportunities}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
