import {
  TodayExecutionStrip,
  NextPlaysSection,
  CashFlowPanel,
  PipelineFlowPanel,
  OpsStatusPanel,
  OwnershipPanel,
} from '../components/owner-dashboard';
import { FC, useEffect, useState } from 'react';
import { getOwnerDashboardData } from '@/lib/api';

const OwnerDashboard: FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getOwnerDashboardData();
      setDashboardData(data);
    };

    fetchData();
  }, []);

  if (!dashboardData) {
    return <div>Loading...</div>;
  }

  const dealsNeedAction = dashboardData.next_plays.length;
  // This logic needs to be implemented based on opportunity stage
  const nearClose = 2;
  const paymentsPending = dashboardData.cash_board.pending_payment;

  return (
    <div className="bg-[#0b0f14] text-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">Owner Dashboard</h1>

        <div className="mb-6">
          <TodayExecutionStrip
            dealsNeedAction={dealsNeedAction}
            nearClose={nearClose}
            paymentsPending={paymentsPending}
          />
        </div>

        <div className="mb-6">
          <NextPlaysSection nextPlays={dashboardData.next_plays} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowPanel cashBoard={dashboardData.cash_board} />
          <PipelineFlowPanel pipelineFlow={dashboardData.pipeline_flow} />
          <OpsStatusPanel opsReady={dashboardData.ops_ready} />
          <OwnershipPanel ownership={dashboardData.ownership} />
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;