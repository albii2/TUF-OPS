import { PageHeader } from "@/components/ui/page-header";
import { NewProgramForm } from "@/components/programs/new-program-form";

export default function NewProgramPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Program"
        description="Create a new school, team, or institutional account."
      />
      <NewProgramForm />
    </div>
  );
}
