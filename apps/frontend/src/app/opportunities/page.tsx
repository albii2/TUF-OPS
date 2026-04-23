'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/v1';

interface Opportunity {
  id: number;
  name: string;
  stage: string;
  channel_type: string;
  organization_id: number;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    async function run() {
      const response = await fetch(`${API_BASE_URL}/opportunities`);
      const all = response.ok ? await response.json() : [];
      setOpportunities(all);
    }

    run().catch(console.error);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Opportunities</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <div key={opp.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{opp.name}</h2>
            <p>Stage: {opp.stage}</p>
            <p>Lane: {opp.channel_type}</p>
            <Link href={`/opportunities/${opp.id}`}>
              <Button className="mt-3">Open</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
