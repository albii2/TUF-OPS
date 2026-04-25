import { NextPlay } from './types'

export default function PressureRow({ play }: { play: NextPlay }) {
  const pressureColor =
    play.pressure_score > 7
      ? 'bg-red-500'
      : play.pressure_score > 4
        ? 'bg-yellow-500'
        : 'bg-blue-500'

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="flex items-center bg-gradient-to-r from-gray-800/20 to-transparent p-3 rounded-lg mb-2 hover:bg-gray-700/40 transition-colors duration-200">
      <div className={`w-1.5 h-10 ${pressureColor} mr-4 rounded-full`} />
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 items-center">
        <div className="lg:col-span-2 font-bold text-xl text-gray-100">{formatCurrency(play.revenue)}</div>
        <div className="lg:col-span-5">
          <div className="text-lg text-gray-200 font-semibold">{play.opportunity_name}</div>
          <div className="text-sm text-gray-400 font-light">{play.organization_name}</div>
        </div>
        <div className="lg:col-span-2 text-sm text-gray-400">
          <div>{play.stage}</div>
          <div className="text-xs font-light">{play.time_in_stage}</div>
        </div>
        <div className="lg:col-span-1 text-sm text-gray-300">{play.rep_name}</div>
        <div className="lg:col-span-2 text-sm text-blue-400 font-semibold">{play.next_action_display}</div>
      </div>
    </div>
  )
}
