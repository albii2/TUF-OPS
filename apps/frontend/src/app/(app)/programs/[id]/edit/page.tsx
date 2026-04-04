import { getProgram } from "@/lib/programs/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { EditProgramForm } from "@/components/programs/edit-program-form";

export default async function EditProgramPage({ params }: { params: { id: string } }) {
    const program = await getProgram(parseInt(params.id, 10));
    const users = await getAssignableUsers();

    if (!program) {
        return (
            <RecordNotFoundState
                recordLabel="Program"
                backHref="/programs"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Edit ${program.name}`}
                description="Update the account record and maintain clean program data."
            />

            <EditProgramForm
                program={program}
                assignableUsers={users}
            />
        </div>
    );
}
