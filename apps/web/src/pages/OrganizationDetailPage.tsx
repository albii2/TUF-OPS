import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrganizationById } from '../lib/api';
import ChannelCard from '../components/organization/ChannelCard';

const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    if (id) {
      getOrganizationById(id).then(setOrganization);
    }
  }, [id]);

  if (!organization) {
    return <div>Loading...</div>;
  }

  const channelOrder = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
  const sortedOpportunities = organization.opportunities.sort((a: any, b: any) => {
    return channelOrder.indexOf(a.channel_type) - channelOrder.indexOf(b.channel_type);
  });

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">{organization.name}</h1>
        {/* Add other basic info here */}
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedOpportunities.map((opp: any) => (
          <ChannelCard key={opp.id} opportunity={opp} />
        ))}
      </main>
    </div>
  );
};

export default OrganizationDetailPage;
