import Link from "next/link";
import { getProgram } from "@/lib/programs/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { Button } from "@/components/ui/button";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";

import { OwnerBadge } from "@/components/shared/owner-badge";
import { ProgramOwnerCard } from "@/components/programs/program-owner-card";
import { ProgramStatusBadge } from "@/components/programs/program-status-badge";
import { ProgramOpportunitiesList } from "@/components/programs/ProgramOpportunitiesList";
import { ProgramContactsCard } from "@/components/programs/program-contacts-card";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";

export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const program = await getProgram(parseInt(params.id, 10));
  
  if (!program) {
    return <RecordNotFoundState recordLabel="Program" backHref="/programs" />;
  }
  
  const users = await getAssignableUsers();

  const opportunities = program.opportunities.map((opp: any) => ({
    ...opp,
    estimated_value: opp.estimated_value.toNumber(),
  }));

  return (
    <DetailPageShell>
      <PageHeader 
        title={program.name}
        actions={
            <PageActions>
                <Link href={`/programs/${program.id}/edit`}>
                    <Button>Edit Program</Button>
                </Link>
            </PageActions>
        }
      />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
                <DetailSection title="Key Information">
                    <DetailFieldList>
                        <DetailField label="Status">
                            <ProgramStatusBadge status={program.status} />
                        </DetailField>
                        <DetailField label="Owner">
                            <OwnerBadge ownerName={program.owner?.name} />
                        </DetailField>
                        <DetailField label="Zoho Account ID">
                            {program.zoho_account_id || "-"}
                        </DetailField>
                    </DetailFieldList>
                </DetailSection>

                <DetailSection title={`Linked Opportunities (${program.opportunities.length})`}>
                    <ProgramOpportunitiesList opportunities={opportunities} />
                </DetailSection>
            </div>
            <div className="col-span-1">
                <ProgramOwnerCard program={program} users={users} />
                <ProgramContactsCard programId={program.id} contacts={program.contacts} />
            </div>
        </div>
    </DetailPageShell>
  );
}
