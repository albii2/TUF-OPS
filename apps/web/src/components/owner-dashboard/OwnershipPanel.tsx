
import { FC } from 'react';

interface OwnershipPanelProps {
  ownership: {
    reps: any[]; // Replace with actual type
    directors: any[]; // Replace with actual type
  };
}

const OwnershipPanel: FC<OwnershipPanelProps> = ({ ownership }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const PerformanceRow = ({ owner }: { owner: any }) => (
    <div className={`bg-gradient-to-r from-gray-800/30 to-gray-800/10 p-2 rounded-lg flex items-center border-l-4 ${Number(owner.stuck_ratio) > 0.5 ? 'border-red-500' : 'border-green-500'}`}>
      <div className="flex-1 font-sans font-medium text-gray-200">{owner.name}</div>
      <div className="w-16 text-right text-gray-300 font-mono">{owner.active_deals}</div>
      <div className="w-16 text-right text-gray-300 font-mono">{owner.stuck_deals}</div>
      <div className="w-20 text-right text-gray-300 font-mono">{Number(owner.stuck_ratio).toFixed(2)}</div>
      <div className="w-28 text-right text-gray-100 font-semibold font-mono">{formatCurrency(owner.total_revenue)}</div>
    </div>
  );

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Ownership</h2>
      <div className="space-y-3">
        <div className="flex items-center text-xs text-gray-400 font-sans uppercase px-2">
          <div className="flex-1">Name</div>
          <div className="w-16 text-right">Active</div>
          <div className="w-16 text-right">Stuck</div>
          <div className="w-20 text-right">Ratio</div>
          <div className="w-28 text-right">Revenue</div>
        </div>
        {ownership.reps.sort((a, b) => b.stuck_ratio - a.stuck_ratio).map((owner, index) => (
          <PerformanceRow key={index} owner={owner} />
        ))}
        <div className="border-t border-gray-700/50 my-3"></div>
        {ownership.directors.sort((a, b) => b.stuck_ratio - a.stuck_ratio).map((owner, index) => (
          <PerformanceRow key={index} owner={owner} />
        ))}
      </div>
    </div>
  );
};

export default OwnershipPanel;
