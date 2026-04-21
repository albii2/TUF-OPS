
import { FC } from 'react';

interface PipelineFlowPanelProps {
  pipelineFlow: any[]; // Replace with actual type
}

const PipelineFlowPanel: FC<PipelineFlowPanelProps> = ({ pipelineFlow }) => {
  const maxCount = Math.max(...pipelineFlow.map(stage => stage.count), 0);

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Pipeline Flow</h2>
      <div className="space-y-3">
        {pipelineFlow.map((stage, index) => (
          <div key={index} className="flex items-center">
            <span className="w-1/3 text-sm text-gray-300 font-medium">{stage.stage_name}</span>
            <div className="w-2/3 bg-gray-800/50 rounded-full h-6 relative">
              <div
                className={`h-6 rounded-full bg-gradient-to-r ${stage.status === 'BOTTLENECK' ? 'from-red-600 to-red-400 animate-pulse-red' : 'from-blue-600 to-blue-400'}`}
                style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                  boxShadow: stage.status !== 'BOTTLENECK' ? '0 0 15px rgba(59, 130, 246, 0.2)' : ''
                }}
              ></div>
            </div>
            <span className="ml-3 font-bold text-lg text-gray-100">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineFlowPanel;
