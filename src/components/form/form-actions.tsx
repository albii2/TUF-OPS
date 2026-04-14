import { Button } from "@/components/ui/button";

export function FormActions({ 
  isPending, 
  submitLabel = "Save Changes", 
}: { 
  isPending?: boolean; 
  submitLabel?: string; 
})
}) {
  return (
    <div className="flex justify-end">
      <Button
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
