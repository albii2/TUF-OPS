'use client'

import { Button } from "@/components/ui/button";

interface OrderItemCardProps {
  title: string;
  status: string;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }
}

// A simple badge-like component for status
const StatusBadge = ({ status, variant }: { status: string, variant: OrderItemCardProps['statusVariant'] }) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    const variants = {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-input bg-transparent text-foreground",
    }
    return <div className={`${baseClasses} ${variants[variant]}`}>{status}</div>
}

export function OrderItemCard({
  title,
  status,
  statusVariant,
  children,
  action,
}: OrderItemCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="flex flex-row items-center justify-between space-y-0 p-6">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <StatusBadge status={status} variant={statusVariant} />
      </div>
      <div className="p-6 pt-0">
        <div className="text-sm text-muted-foreground mb-4">
            {children}
        </div>
        {action && (
            <Button onClick={action.onClick} disabled={action.disabled} className="w-full">
                {action.label}
            </Button>
        )}
      </div>
    </div>
  );
}
