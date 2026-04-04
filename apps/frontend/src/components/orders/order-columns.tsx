'use client'

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { UniformOrder, Opportunity, Organization } from "@prisma/client"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Define the shape of the data for the table
type OrderRow = UniformOrder & {
    opportunity: Opportunity & {
        organization: Organization
    }
}

export const columns: ColumnDef<OrderRow>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order ID" />,
        cell: ({ row }) => <p className="font-mono">#{row.original.id.substring(0, 7)}</p>
    },
    {
        accessorKey: "opportunity.organization.name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button asChild variant="secondary">
                <Link href={`/orders/${row.original.id}`}>View Order</Link>
            </Button>
        ),
    },
]
