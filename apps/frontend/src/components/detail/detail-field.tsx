import type { ReactNode } from "react";

interface DetailFieldProps {
  label: string;
  children: ReactNode;
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-base font-semibold">{children}</div>
    </div>
  );
}
