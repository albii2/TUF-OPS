"use client";

import { ProgramStatus } from "@prisma/client";

const STATUS_OPTIONS: ProgramStatus[] = ["active", "inactive", "archived"];

export function ProgramStatusSelect({
  value,
  onChange,
}: {
  value?: ProgramStatus | null;
  onChange: (value: ProgramStatus) => void;
}) {
  return (
    <select
      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      value={value ?? "active"}
      onChange={(e) => onChange(e.target.value as ProgramStatus)}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
}
