"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OwnerOption = {
  id: number;
  name?: string | null;
  email?: string | null;
};

const UNASSIGNED_VALUE = "__UNASSIGNED__";

export function OwnerSelect({
  value,
  options,
  onChange,
}: {
  value?: number | null;
  options: OwnerOption[];
  onChange: (value: number | null) => void;
}) {
  return (
    <Select
      value={value?.toString() ?? UNASSIGNED_VALUE}
      onValueChange={(val) => onChange(val === UNASSIGNED_VALUE ? null : parseInt(val, 10))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select an owner..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            {option.name || option.email || option.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
