interface TodayExecutionStripProps {
  dealsNeedAction: number
  nearClose: number
  paymentsPending: number
}

export default function TodayExecutionStrip({
  dealsNeedAction,
  nearClose,
  paymentsPending,
}: TodayExecutionStripProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg border border-red-500/20">
        <p className="text-4xl font-bold text-red-400">
          {dealsNeedAction} <span className="text-2xl">→</span>
        </p>
        <p className="text-xs text-gray-400 font-light">Deals Need Action</p>
      </div>
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg border border-yellow-500/20">
        <p className="text-4xl font-bold text-yellow-400">
          {nearClose} <span className="text-2xl">→</span>
        </p>
        <p className="text-xs text-gray-400 font-light">Near Close</p>
      </div>
      <div className="bg-gray-900/50 p-3 rounded-xl shadow-lg border border-blue-500/20">
        <p className="text-4xl font-bold text-blue-400">
          {formatCurrency(paymentsPending)} <span className="text-2xl">→</span>
        </p>
        <p className="text-xs text-gray-400 font-light">Payments Pending</p>
      </div>
    </div>
  )
}
