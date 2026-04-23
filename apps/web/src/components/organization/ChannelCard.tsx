import React from 'react';

interface ChannelCardProps {
  opportunity: {
    channel_type: string;
    stage: string;
    assigned_rep: { first_name: string; last_name: string };
    next_action: string;
    value: number;
  };
}

const ChannelCard: React.FC<ChannelCardProps> = ({ opportunity }) => {
  const { channel_type, stage, assigned_rep, next_action, value } = opportunity;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-white">{channel_type.replace('_', ' ')}</h3>
      <div className="space-y-3 text-gray-400">
        <p><span className="font-semibold">Stage:</span> {stage}</p>
        <p><span className="font-semibold">Owner:</span> {assigned_rep ? `${assigned_rep.first_name} ${assigned_rep.last_name}` : 'Unassigned'}</p>
        <p><span className="font-semibold">Next Action:</span> {next_action}</p>
        <p><span className="font-semibold">Value:</span> ${value.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ChannelCard;
