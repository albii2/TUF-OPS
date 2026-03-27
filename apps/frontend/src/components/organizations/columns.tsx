'use client'

import { ColumnDef } from "@tanstack/react-table"
import { OrganizationWithOwner } from "@/app/(app)/organizations/page";
import { OrganizationStatusBadge } from "./organization-status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import Link from "next/link";

export const columns: ColumnDef<OrganizationWithOwner>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
        const org = row.original;
        return <Link href={`/organizations/${org.id}`} className="font-semibold hover:underline">{org.name}</Link>
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
];
