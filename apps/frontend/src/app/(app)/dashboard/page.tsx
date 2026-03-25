import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { Building, Briefcase } from "lucide-react";

export default async function DashboardPage() {
  const orgCount = await prisma.organization.count();
  const oppCount = await prisma.opportunity.count();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total Organizations"
        value={orgCount}
        icon={<Building className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard 
        title="Total Opportunities"
        value={oppCount}
        icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
