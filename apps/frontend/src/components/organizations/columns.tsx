'use client'

import { ColumnDef } from "@tanstack/react-table"
import { OrganizationWithOwner } from "@/app/(app)/organizations/page";
import { OrganizationStatusBadge } from "./organization-status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";

export const columns: ColumnDef<OrganizationWithOwner>[] = [
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
    accessorKey: "status",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
        const org = row.original;
        return <OrganizationStatusBadge status={org.status} />;
    },
  },
  {
    accessorKey: "owner.name",
    header: "Owner",
    cell: ({ row }) => {
      const org = row.original;
      return org.owner?.name ?? <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions 
        row={row} 
        viewHref={`/organizations/${row.original.id}`}
        editHref={`/organizations/${row.original.id}/edit`}
      />
    ),
  },
];
