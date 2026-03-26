"use client";

import { OrganizationStatus } from "@prisma/client";

const STATUS_OPTIONS: OrganizationStatus[] = ["active", "inactive", "archived"];

export function OrganizationStatusSelect({
  value,
  onChange,
}: {
  value?: OrganizationStatus | null;
  onChange: (value: OrganizationStatus) => void;
}) {
  return (
    <select
      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      value={value ?? "active"}
      onChange={(e) => onChange(e.target.value as OrganizationStatus)}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
}
