
import { FC } from 'react';

interface CashFlowPanelProps {
  cashBoard: {
    pending_payment: number;
    recently_paid_amount: number;
    recently_closed_amount: number;
    avg_days_to_payment: number;
    conversion_rate: number;
  };
}

const CashFlowPanel: FC<CashFlowPanelProps> = ({ cashBoard }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const MetricTile = ({ label, value, colorClass }: { label: string, value: string, colorClass: string }) => (
    <div className={`bg-gray-800/30 p-3 rounded-lg border-l-4 ${colorClass}`}>
      <p className="text-3xl font-bold text-gray-100">{value}</p>
      <p className="text-xs font-light text-gray-400">{label}</p>
    </div>
  );

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Cash Flow</h2>
      <div className="space-y-3">
        <MetricTile label="Pending Payment" value={formatCurrency(cashBoard.pending_payment)} colorClass="border-yellow-500" />
        <MetricTile label="Recently Paid" value={formatCurrency(cashBoard.recently_paid_amount)} colorClass="border-green-500" />
        <MetricTile label="Recently Closed" value={formatCurrency(cashBoard.recently_closed_amount)} colorClass="border-blue-500" />
        <MetricTile label="Avg Days to Payment" value={Number(cashBoard.avg_days_to_payment).toFixed(0)} colorClass="border-gray-500" />
        <MetricTile label="Conversion Rate" value={`${Number(cashBoard.conversion_rate).toFixed(0)}%`} colorClass="border-purple-500" />
      </div>
    </div>
  );
};

export default CashFlowPanel;
