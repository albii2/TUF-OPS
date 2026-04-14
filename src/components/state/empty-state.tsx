import type { ReactNode } from "react";

export function EmptyState({ 
  title, 
  description, 
  action, 
}: { 
  title: string; 
  description?: string; 
  action?: ReactNode; 
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
      <div className="mx-auto max-w-md space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="pt-3">{action}</div> : null}
      </div>
    </div>
  );
}
