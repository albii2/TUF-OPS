"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Organization } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "zoho_account_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Zoho ID" />
    ),
  },
];
