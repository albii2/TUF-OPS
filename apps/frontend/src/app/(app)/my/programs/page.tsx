'use client'

import { useEffect, useState } from 'react';
import { requireSession } from "@/lib/auth/session";
import { getMyPrograms } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/programs/columns";
import { Program, User } from "@prisma/client";

export type ProgramWithOwner = Program & { owner: User | null };

export default function MyProgramsPage() {
    const [programs, setPrograms] = useState<ProgramWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const progs = await getMyPrograms();
            setPrograms(progs as ProgramWithOwner[]);
        }
        fetchData();
    }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Programs"
        description="The accounts you own and are responsible for."
      />
      <DataTable 
        columns={columns}
        data={programs} 
        searchKey="name"
      />
    </div>
  );
}
