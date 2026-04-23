'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/v1';

interface Organization {
  id: number;
  name: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/organizations`).then((res) => res.json()).then(setOrganizations).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto py-10" data-testid="page-organizations">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader><CardTitle>{org.name}</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/organizations/${org.id}`} className="text-blue-600">View channel lanes</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
