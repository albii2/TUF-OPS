import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

export function RecordNotFoundState({ 
  recordLabel, 
  backHref, 
}: { 
  recordLabel: string; 
  backHref: string; 
}) {
  return (
    <EmptyState 
      title={`${recordLabel} not found`} 
      description={`The requested ${recordLabel.toLowerCase()} could not be found or may have been removed.`} 
      action={
        <Button asChild>
          <Link href={backHref}>Go Back</Link>
        </Button>
      }
    />
  );
}
