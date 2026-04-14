import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPipelineSnapshot({ snapshot }: { snapshot: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {snapshot.map((item: any) => (
                <div key={item.stage} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{item.stage.replace('_', ' ')}</span>
                    <span className="font-semibold">{item.count}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
