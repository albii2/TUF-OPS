'use client'

import { Lead } from '@prisma/client'
import { DataTable } from '@/components/data-table/data-table'
import { LeadQueueEntry } from '@/types/lead';
import { getLeadColumns } from './lead-columns'

export function LeadTable({ leads }: { leads: LeadQueueEntry[] }) {
  const columns = getLeadColumns([], '');
  return <DataTable columns={columns as any} data={leads} searchKey="organizationName" />
}
