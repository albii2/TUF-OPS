import { Button } from "@/components/ui/button";

export function FormActions({ 
  isSubmitting, 
  submitLabel = "Save", 
}: { 
  isSubmitting?: boolean; 
  submitLabel?: string; 
}) {
  return (
    <div className="flex justify-end">
      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
