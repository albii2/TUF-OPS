'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Opportunity } from "@/lib/types/opportunity";
import { OpportunityWithOwner } from "@/app/(app)/opportunities/page";
import { StageBadge } from "./StageBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import Link from "next/link";

export const columns: ColumnDef<OpportunityWithOwner>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
        const opp = row.original;
        return <Link href={`/opportunities/${opp.id}`} className="font-semibold hover:underline">{opp.name}</Link>
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
];
