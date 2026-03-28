'use client'

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { Opportunity } from "@prisma/client";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { StageBadge } from "./StageBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { QuickUpdateOpportunityForm } from "./quick-update-opportunity-form";

export type RepOpportunity = Opportunity & {
    organization: {
        id: number;
        name: string;
    } | null;
}

const QuickUpdateAction = ({ opportunity }: { opportunity: RepOpportunity }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Quick Update
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quick Update: {opportunity.name}</DialogTitle>
                </DialogHeader>
                <QuickUpdateOpportunityForm opportunity={opportunity} onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}

export const columns: ColumnDef<RepOpportunity>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
        return <Link href={`/opportunities/${row.original.id}`} className="hover:underline">{row.getValue("name")}</Link>
    }
  },
  {
    accessorKey: "organization.name",
    header: "Organization",
    cell: ({ row }) => {
        const opp = row.original;
        if (!opp.organization) {
            return <span className="text-muted-foreground">-</span>
        }
        return <Link href={`/organizations/${opp.organization.id}`} className="hover:underline">{opp.organization.name}</Link>
    }
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      return <StageBadge stage={row.original.stage} />;
    },
  },
    {
        accessorKey: "nextStep",
        header: "Next Step",
    },
    {
        accessorKey: "nextStepDueDate",
        header: "Due Date",
        cell: ({ row }) => {
            const date = row.original.nextStepDueDate;
            return date ? new Date(date).toLocaleDateString() : '-';
        }
    },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions 
        row={row} 
        viewHref={`/opportunities/${row.original.id}`}
      >
        <QuickUpdateAction opportunity={row.original} />
      </DataTableRowActions>
    ),
  },
];
