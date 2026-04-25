import PressureRow from './PressureRow'
import { NextPlay } from './types'

interface NextPlaysSectionProps {
  nextPlays: NextPlay[]
}

export default function NextPlaysSection({ nextPlays }: NextPlaysSectionProps) {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Next Plays</h2>
      <div className="space-y-3">
        {nextPlays.map((play, index) => (
          <PressureRow key={`${play.opportunity_name}-${index}`} play={play} />
        ))}
      </div>
    </div>
  )
}
