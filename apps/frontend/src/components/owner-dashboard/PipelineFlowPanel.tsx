import { PipelineStage } from './types'

interface PipelineFlowPanelProps {
  pipelineFlow: PipelineStage[]
}

export default function PipelineFlowPanel({ pipelineFlow }: PipelineFlowPanelProps) {
  const maxCount = Math.max(...pipelineFlow.map((stage) => stage.count), 0)

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Pipeline Flow</h2>
      <div className="space-y-3">
        {pipelineFlow.map((stage) => (
          <div key={stage.stage_name} className="flex items-center">
            <span className="w-1/3 text-sm text-gray-300 font-medium">{stage.stage_name}</span>
            <div className="w-2/3 bg-gray-800/50 rounded-full h-6 relative overflow-hidden">
              <div
                className={`h-6 rounded-full bg-gradient-to-r ${
                  stage.status === 'BOTTLENECK'
                    ? 'from-red-600 to-red-400 animate-pulse'
                    : 'from-blue-600 to-blue-400'
                }`}
                style={{ width: maxCount === 0 ? '0%' : `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="ml-3 font-bold text-lg text-gray-100">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
