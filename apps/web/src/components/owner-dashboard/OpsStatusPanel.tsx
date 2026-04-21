
import { FC } from 'react';

interface OpsStatusPanelProps {
  opsReady: {
    needs_action: number;
    ready_for_vendor: number;
    in_production: number;
    stalled: number;
  };
}

const OpsStatusPanel: FC<OpsStatusPanelProps> = ({ opsReady }) => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Ops Status</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center bg-gray-800/50 p-3 rounded-lg shadow-lg" style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
          <p className="text-3xl font-bold text-red-400">{opsReady.needs_action}</p>
          <p className="text-xs text-gray-400 font-light">Needs Action</p>
        </div>
        <div className="text-center bg-gray-800/50 p-3 rounded-lg shadow-lg" style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
          <p className="text-3xl font-bold text-yellow-400">{opsReady.ready_for_vendor}</p>
          <p className="text-xs text-gray-400 font-light">Ready for Vendor</p>
        </div>
        <div className="text-center bg-gray-800/50 p-3 rounded-lg shadow-lg" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
          <p className="text-3xl font-bold text-blue-400">{opsReady.in_production}</p>
          <p className="text-xs text-gray-400 font-light">In Production</p>
        </div>
        <div className="text-center bg-gray-800/50 p-3 rounded-lg">
          <p className="text-3xl font-bold text-gray-400">{opsReady.stalled}</p>
          <p className="text-xs text-gray-400 font-light">Stalled</p>
        </div>
      </div>
    </div>
  );
};

export default OpsStatusPanel;
