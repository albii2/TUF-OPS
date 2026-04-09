'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Opportunity } from "@/lib/types/opportunity";
import { OpportunityWithOwner } from "@/app/(app)/opportunities/page";
import { StageBadge } from "./StageBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import Link from "next/link";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { isPast } from "date-fns";

export const columns: ColumnDef<OpportunityWithOwner>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
        return <div>{row.getValue("name")}</div>
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
      const opp = row.original;
      return <StageBadge stage={opp.stage} />;
    },
  },
    {
        accessorKey: "nextStep",
        header: "Next Step",
        cell: ({ row }) => {
            const opp = row.original;
            if (!opp.nextStep) {
                return <div className="flex items-center text-yellow-600"><AlertTriangle className="w-4 h-4 mr-1" /> Missing</div>
            }
            
            const isOverdue = opp.nextStepDueDate && isPast(new Date(opp.nextStepDueDate));

            return <div className="flex items-center">
                {isOverdue && <AlertCircle className="w-4 h-4 mr-1 text-red-600" />}
                {opp.nextStep}
            </div>
        }
    },
  {
    accessorKey: "owner.name",
    header: "Owner",
    cell: ({ row }) => {
      const opp = row.original;
      return opp.owner?.name ?? <span className="text-muted-foreground">-</span>;
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
