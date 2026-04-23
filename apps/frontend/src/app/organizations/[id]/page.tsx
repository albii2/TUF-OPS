'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { REQUIRED_CHANNEL_ORDER, API_BASE_URL } from '@/lib/v1';

interface Lane {
  id: number;
  channel_type: string;
  stage: string;
}

interface OrganizationDetail {
  id: number;
  name: string;
  lanes: Lane[];
}

export default function OrganizationDetailsPage() {
  const params = useParams();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/organizations/${params.id}`).then((res) => res.json()).then(setOrganization).catch(console.error);
  }, [params.id]);

  if (!organization) return <p>Loading...</p>;

  const sorted = [...organization.lanes].sort((a, b) => REQUIRED_CHANNEL_ORDER.indexOf(a.channel_type as any) - REQUIRED_CHANNEL_ORDER.indexOf(b.channel_type as any));

  return (
    <div className="container mx-auto py-10 space-y-4">
      <h1 className="text-3xl font-bold">{organization.name}</h1>
      <p className="text-sm text-gray-500">Guaranteed 4-lane execution view</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.map((lane) => (
          <div key={lane.id} className="border rounded p-4">
            <h2 className="font-semibold">{lane.channel_type}</h2>
            <p>{lane.stage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
