"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Opportunity } from "@prisma/client";
import { OpportunityWithOwner } from "@/app/(app)/opportunities/page";
import { StageBadge } from "./StageBadge";

export const columns: ColumnDef<OpportunityWithOwner>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "stage",
    header: "Stage",
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
    header: "Value",
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
