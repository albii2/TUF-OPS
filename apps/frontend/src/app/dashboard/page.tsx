import {
  TodayExecutionStrip,
  NextPlaysSection,
  CashFlowPanel,
  PipelineFlowPanel,
  OpsStatusPanel,
  OwnershipPanel,
  OwnerDashboardData,
} from '@/components/owner-dashboard'

const ownerDashboardData: OwnerDashboardData = {
  next_plays: [
    {
      revenue: 18400,
      opportunity_name: 'Varsity Football Uniform Refresh',
      organization_name: 'North Valley HS',
      stage: 'Prove the Gear',
      time_in_stage: '8 days in stage',
      rep_name: 'A. Brooks',
      next_action_display: 'Sample follow-up (Today)',
      pressure_score: 9,
    },
    {
      revenue: 9600,
      opportunity_name: 'Spring Club Team Store',
      organization_name: 'Canyon FC',
      stage: 'Invoice & Secure Payment',
      time_in_stage: '4 days in stage',
      rep_name: 'J. Chen',
      next_action_display: 'Payment reminder',
      pressure_score: 6,
    },
    {
      revenue: 5200,
      opportunity_name: 'AAU Warmups Add-on',
      organization_name: 'Metro Hoops',
      stage: 'Engage',
      time_in_stage: '2 days in stage',
      rep_name: 'S. Patel',
      next_action_display: 'Design kickoff call',
      pressure_score: 3,
    },
  ],
  cash_board: {
    pending_payment: 28000,
    recently_paid_amount: 12400,
    recently_closed_amount: 19600,
    avg_days_to_payment: 11,
    conversion_rate: 64,
  },
  pipeline_flow: [
    { stage_name: 'Prospect', count: 14, status: 'HEALTHY' },
    { stage_name: 'Engage', count: 9, status: 'HEALTHY' },
    { stage_name: 'Design the Win', count: 7, status: 'HEALTHY' },
    { stage_name: 'Prove the Gear', count: 5, status: 'BOTTLENECK' },
    { stage_name: 'Close', count: 3, status: 'HEALTHY' },
  ],
  ops_ready: {
    needs_action: 4,
    ready_for_vendor: 6,
    in_production: 5,
    stalled: 2,
  },
  ownership: {
    reps: [
      { name: 'A. Brooks', active_deals: 8, stuck_deals: 4, stuck_ratio: 0.5, total_revenue: 74800 },
      { name: 'J. Chen', active_deals: 7, stuck_deals: 2, stuck_ratio: 0.29, total_revenue: 62350 },
      { name: 'S. Patel', active_deals: 6, stuck_deals: 1, stuck_ratio: 0.17, total_revenue: 51200 },
    ],
    directors: [
      { name: 'L. Martin', active_deals: 12, stuck_deals: 4, stuck_ratio: 0.33, total_revenue: 187300 },
      { name: 'R. Diaz', active_deals: 9, stuck_deals: 2, stuck_ratio: 0.22, total_revenue: 143900 },
    ],
  },
}

export default function DashboardPage() {
  const dealsNeedAction = ownerDashboardData.next_plays.length
  const nearClose = ownerDashboardData.pipeline_flow.find((stage) => stage.stage_name === 'Close')?.count ?? 0
  const paymentsPending = ownerDashboardData.cash_board.pending_payment

  return (
    <main className="bg-[#0b0f14] text-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans" data-testid="page-dashboard">
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
          <NextPlaysSection nextPlays={ownerDashboardData.next_plays} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowPanel cashBoard={ownerDashboardData.cash_board} />
          <PipelineFlowPanel pipelineFlow={ownerDashboardData.pipeline_flow} />
          <OpsStatusPanel opsReady={ownerDashboardData.ops_ready} />
          <OwnershipPanel ownership={ownerDashboardData.ownership} />
        </div>
      </div>
    </main>
  )
}
