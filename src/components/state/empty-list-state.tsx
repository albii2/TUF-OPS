import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

export function EmptyListState({ 
  resourceName, 
  description, 
  action, 
}: { 
  resourceName: string; 
  description?: string; 
  action?: ReactNode; 
}) {
  return (
    <EmptyState 
      title={`No ${resourceName} yet`} 
      description={
        description ?? 
        `Create the first ${resourceName.slice(0, -1)} to begin building your pipeline.`
      }
      action={action}
    />
  );
}
