'use client'

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/programs/columns";
import { Program, User } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";
import { getPrograms } from './actions';

export type ProgramWithOwner = Program & { owner: User | null };

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<ProgramWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const progs = await getPrograms();
            setPrograms(progs as ProgramWithOwner[]);
        }
        fetchData();
    }, []);

  if (programs.length === 0) {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Programs"
                description="Manage accounts, associated deals, and key contacts."
            />
            <EmptyListState
                resourceName="Programs"
                description="Create your first program to begin managing accounts."
                action={
                    <Button asChild>
                        <Link href="/programs/new">New Program</Link>
                    </Button>
                }
            />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description="Manage accounts, associated deals, and key contacts."
        actions={
          <PageActions>
            <Link href="/programs/new">
              <Button>New Program</Button>
            </Link>
          </PageActions>
        }
      />
      <DataTable 
        columns={columns}
        data={programs} 
        searchKey="name"
      />
    </div>
  );
}
