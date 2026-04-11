
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Order, Opportunity, Organization } from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type OrderWithRelations = Order & { 
    opportunity: Opportunity & { organization: Organization };
};

export const columns: ColumnDef<OrderWithRelations>[] = [
    {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => {
            const order = row.original;
            return <Link href={`/orders/${order.id}`} className="font-medium text-primary hover:underline">{order.orderNumber}</Link>
        }
    },
    {
        accessorKey: "opportunity.name",
        header: "Opportunity",
        cell: ({ row }) => {
            const opportunity = row.original.opportunity;
            return <Link href={`/opportunities/${opportunity.id}`} className="hover:underline">{opportunity.name}</Link>
        }
    },
    {
        accessorKey: "opportunity.organization.name",
        header: "Organization",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            return <Badge>{row.getValue("status")}</Badge>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <span>{date.toLocaleDateString()}</span>;
        },
    },
];
