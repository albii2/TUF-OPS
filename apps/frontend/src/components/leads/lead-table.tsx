'use client'

import { User } from "@prisma/client";
import { DataTable } from "@/components/data-table/data-table";
import { getLeadColumns } from "@/components/leads/lead-columns";
import type { LeadQueueEntry } from "@/types/lead";

interface LeadTableProps {
  leads: LeadQueueEntry[];
  assignableUsers: User[];
  userRole: string;
}

export function LeadTable({ leads, assignableUsers, userRole }: LeadTableProps) {
  const columns = getLeadColumns(assignableUsers, userRole);

  return (
    <DataTable 
      columns={columns} 
      data={leads} 
      searchKey="organizationName" 
      emptyStateMessage="The lead queue is empty. Great work! New leads created by an Admin will appear here."
    />
  );
}
