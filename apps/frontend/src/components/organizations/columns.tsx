"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@prisma/client";
import { OrganizationWithOwner } from "@/app/(app)/organizations/page";
import { OrganizationStatusBadge } from "./organization-status-badge";

export const columns: ColumnDef<OrganizationWithOwner>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
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
