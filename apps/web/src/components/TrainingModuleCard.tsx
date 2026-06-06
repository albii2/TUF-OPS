import React from 'react';
import { TrainingModule, TrainingProgress } from '../hooks/useTrainingEnrollment';

interface TrainingModuleCardProps {
  module: TrainingModule;
  progress?: TrainingProgress;
  onSelect: () => void;
}

export default function TrainingModuleCard({ module, progress, onSelect }: TrainingModuleCardProps) {
  const isCompleted = progress?.status === 'COMPLETED';
  const isStarted = progress?.status === 'IN_PROGRESS';
  const statusText = isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Not Started';
  const statusColor = isCompleted ? 'text-green-600' : isStarted ? 'text-blue-600' : 'text-gray-600';

  return (
    <div
      onClick={onSelect}
      className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{module.title}</h3>
          <p className={`text-sm mt-1 ${statusColor}`}>{statusText}</p>
        </div>
        {isCompleted && <span className="text-lg">✓</span>}
      </div>

      {/* Description */}
      {module.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
      )}

      {/* Module Type and Duration */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
          {module.module_type}
        </span>
        {module.estimated_duration_minutes && (
          <span>⏱️ {module.estimated_duration_minutes} min</span>
        )}
      </div>

      {/* Progress Bar */}
      {isStarted && progress?.time_spent_seconds && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Time Spent</span>
            <span className="text-xs text-gray-600">
              {Math.floor(progress.time_spent_seconds / 60)}m
              {progress.time_spent_seconds % 60}s
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (progress.time_spent_seconds / (module.estimated_duration_minutes || 20) / 60) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100 transition-colors">
        {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start Module'}
      </button>
    </div>
  );
}
