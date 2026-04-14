import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/stage-utils";

interface OpportunityStageSelectProps {
    defaultValue?: string;
    onValueChange: (value: string) => void;
}

export function OpportunityStageSelect({ defaultValue, onValueChange }: OpportunityStageSelectProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a stage..." />
      </SelectTrigger>
      <SelectContent>
        {OPPORTUNITY_STAGES.map(stage => (
          <SelectItem key={stage} value={stage}>
            {OPPORTUNITY_STAGE_LABELS[stage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
