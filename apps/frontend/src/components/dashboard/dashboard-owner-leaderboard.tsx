import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardOwnerLeaderboard({ owners }: { owners: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {owners.map((item: any) => (
                <div key={item.ownerName} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{item.ownerName}</span>
                    <span className="font-semibold">{item.count}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
