
import { FC } from 'react';

interface TodayExecutionStripProps {
  dealsNeedAction: number;
  nearClose: number;
  paymentsPending: number;
}

const TodayExecutionStrip: FC<TodayExecutionStripProps> = ({ dealsNeedAction, nearClose, paymentsPending }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  return (
    <div className="grid grid-cols-3 gap-6 text-center">
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg" style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
        <p className="text-4xl font-bold text-red-400">{dealsNeedAction} <span className="text-2xl">→</span></p>
        <p className="text-xs text-gray-400 font-light">Deals Need Action</p>
      </div>
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg" style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
        <p className="text-4xl font-bold text-yellow-400">{nearClose} <span className="text-2xl">→</span></p>
        <p className="text-xs text-gray-400 font-light">Near Close</p>
      </div>
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
        <p className="text-4xl font-bold text-blue-400">{formatCurrency(paymentsPending)} <span className="text-2xl">→</span></p>
        <p className="text-xs text-gray-400 font-light">Payments Pending</p>
      </div>
    </div>
  );
};

export default TodayExecutionStrip;
