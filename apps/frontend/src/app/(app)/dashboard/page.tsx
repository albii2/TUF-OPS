import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { Building, Briefcase } from "lucide-react";

export default async function DashboardPage() {
  const orgCount = await prisma.organization.count();
  const oppCount = await prisma.opportunity.count();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today’s Focus"
        description="Monitor activity and quickly create the records that drive your pipeline."
        actions={
          <PageActions>
            <Button asChild>
              <Link href="/organizations/new">New Organization</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/opportunities/new">New Opportunity</Link>
            </Button>
          </PageActions>
        }
      />

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
    </div>
  );
}
