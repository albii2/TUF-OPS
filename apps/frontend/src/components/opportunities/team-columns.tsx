'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Opportunity } from "@/lib/types/opportunity";
import { OpportunityWithProgram } from "@/app/(app)/opportunities/page";
import { StageBadge } from "./StageBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import Link from "next/link";
import { User } from "@prisma/client";
import { OwnerSelect } from "@/components/shared/owner-select";
import { updateOpportunityOwner } from "@/app/(app)/opportunities/team/actions";
import { toast } from "sonner";

const onOwnerChange = async (oppId: number, newOwnerId: number | null) => {
    try {
        await updateOpportunityOwner(oppId, newOwnerId);
        toast.success("Opportunity owner updated.");
    } catch (e: any) {
        toast.error("Error updating owner", { description: e.message });
    }
}

export const getTeamColumns = (assignableUsers: User[]): ColumnDef<OpportunityWithProgram>[] => [
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
    accessorKey: "program.name",
    header: "Program",
    cell: ({ row }) => {
        const opp = row.original;
        if (!opp.program) {
            return <span className="text-muted-foreground">-</span>
        }
        return <Link href={`/programs/${opp.program.id}`} className="hover:underline">{opp.program.name}</Link>
    }
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const opp = row.original;
      return <StageBadge stage={opp.stage} />;
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const opp = row.original;
      return <OwnerSelect 
        options={assignableUsers} 
        value={opp.owner?.id} 
        onChange={(newOwnerId) => onOwnerChange(opp.id, newOwnerId)} 
      />;
    },
  },
  {
    accessorKey: "estimated_value",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
    ),
    cell: ({ row }) => {
      const opp = row.original;
      const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(opp.estimated_value));
      return formattedValue;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions 
        row={row} 
        viewHref={`/opportunities/${row.original.id}`}
        editHref={`/opportunities/${row.original.id}/edit`}
      />
    ),
  },
];
