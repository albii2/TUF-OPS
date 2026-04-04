'use client'

import { ColumnDef } from "@tanstack/react-table"
import { ProgramWithOwner } from "@/app/(app)/organizations/page";
import { ProgramStatusBadge } from "./program-status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";

export const columns: ColumnDef<ProgramWithOwner>[] = [
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
        const program = row.original;
        return <ProgramStatusBadge status={program.status} />;
    },
  },
  {
    accessorKey: "owner.name",
    header: "Owner",
    cell: ({ row }) => {
      const program = row.original;
      return program.owner?.name ?? <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions 
        row={row} 
        viewHref={`/programs/${row.original.id}`}
        editHref={`/programs/${row.original.id}/edit`}
      />
    ),
  },
];
