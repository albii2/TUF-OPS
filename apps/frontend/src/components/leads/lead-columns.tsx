'use client'

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table"
import { User } from "@prisma/client";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { LeadQueueEntry } from "@/types/lead";
import { UserSelect } from "@/components/users/user-select";
import { assignLead } from "@/app/(app)/leads/_actions/assignLead";
import { Button } from "@/components/ui/button";
import { convertLead } from "@/app/(app)/leads/_actions/convertLead";

// --- Inline Assignment Component ---
const InlineAssign = ({ lead, assignableUsers }: { lead: LeadQueueEntry, assignableUsers: User[] }) => {
    const router = useRouter();
    let [isPending, startTransition] = useTransition();

    const handleAssign = (userId: number | null) => {
        if (userId === null) return;
        
        startTransition(() => {
            assignLead({ leadId: lead.id, userId })
                .then(() => {
                    toast.success("Lead assigned successfully!");
                    router.refresh();
                })
                .catch((err) => toast.error("Failed to assign lead."));
        });
    };

    return <UserSelect 
              users={assignableUsers} 
              onChange={handleAssign} 
              placeholder="Unassigned"
              disabled={isPending}
            />
}

// --- Inline Convert Component ---
const InlineConvert = ({ lead }: { lead: LeadQueueEntry }) => {
    const router = useRouter();
    let [isPending, startTransition] = useTransition();

    const handleConvert = () => {
        startTransition(() => {
            convertLead({ leadId: lead.id })
                .then(() => {
                    toast.success("Lead converted successfully!");
                    router.refresh();
                })
                .catch((err) => toast.error("Failed to convert lead."));
        });
    }

    return <Button onClick={handleConvert} disabled={isPending}>Convert</Button>
}


// --- Main Column Definitions ---
export const getLeadColumns = (assignableUsers: User[], userRole: string): ColumnDef<LeadQueueEntry>[] => [
  {
    accessorKey: "organizationName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>,
  },
  {
    accessorKey: "assignedTo.name",
    header: "Owner",
    cell: ({ row }) => {
        if (row.original.status === 'NEW' && userRole !== 'rep') {
            return <InlineAssign lead={row.original} assignableUsers={assignableUsers} />
        }
        return row.original.assignedTo?.name || <span className="text-muted-foreground">Unassigned</span>;
    }
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
        if (row.original.status === 'ASSIGNED' && userRole !== 'rep') {
            return <InlineConvert lead={row.original} />
        }
        if (row.original.status === 'CONVERTED') {
            return <Badge variant="secondary">Converted</Badge>
        }
        return null;
    },
  },
];