"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Opportunity } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { OwnerBadge } from "@/components/shared/owner-badge";

export const columns: ColumnDef<Opportunity & { owner: { name: string | null } | null }>[] = [
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
    accessorKey: "owner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => <OwnerBadge ownerName={row.original.owner?.name} />,
  },
  {
    accessorKey: "estimated_value",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
    ),
    cell: ({ row }) => {
      const amount = row.original.estimated_value ? Number(row.original.estimated_value) : 0;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];