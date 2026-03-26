import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";

export function OpportunityNextStepCard({
  nextStep,
  nextStepDueDate,
  ownerName,
}: {
  nextStep?: string | null;
  nextStepDueDate?: string | Date | null;
  ownerName?: string | null;
}) {
  return (
    <DetailSection title="Next Step">
      <DetailFieldList>
        <DetailField
          label="Next Step"
        >
            {nextStep?.trim() || "No next step recorded yet."}
        </DetailField>
        <DetailField
          label="Due Date"
        >
            {nextStepDueDate
              ? new Date(nextStepDueDate).toLocaleDateString()
              : "Not set"}
        </DetailField>
        <DetailField
          label="Owner"
        >
            {ownerName?.trim() || "Unassigned"}
        </DetailField>
      </DetailFieldList>
    </DetailSection>
  );
}
