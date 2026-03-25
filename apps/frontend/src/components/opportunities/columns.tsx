"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Opportunity } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Opportunity>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
  },
  {
    accessorKey: "estimated_value",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("estimated_value"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];
