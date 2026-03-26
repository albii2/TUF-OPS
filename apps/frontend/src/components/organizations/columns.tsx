"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { OwnerBadge } from "@/components/shared/owner-badge";

export const columns: ColumnDef<Organization & { owner: { name: string | null } | null }>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "owner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => <OwnerBadge ownerName={row.original.owner?.name} />,
  },
];