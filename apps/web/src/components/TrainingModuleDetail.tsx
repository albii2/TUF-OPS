import React, { useState, useEffect } from 'react';
import { TrainingModule, TrainingProgress, TrainingEnrollment } from '../hooks/useTrainingEnrollment';
import { useTrainingModule } from '../hooks/useTrainingEnrollment';

interface TrainingModuleDetailProps {
  module: TrainingModule;
  enrollment: TrainingEnrollment;
  progress?: TrainingProgress;
  onClose: () => void;
  onProgressUpdate: () => void;
}

export default function TrainingModuleDetail({
  module,
  enrollment,
  progress,
  onClose,
  onProgressUpdate,
}: TrainingModuleDetailProps) {
  const { startModule, completeModule, loading } = useTrainingModule(module.id, enrollment.id);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(progress?.time_spent_seconds || 0);

  useEffect(() => {
    if (progress?.status !== 'COMPLETED' && !startTime && progress?.status !== 'NOT_STARTED') {
      setStartTime(Date.now());
    }
  }, [progress, startTime]);

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleStart = async () => {
    try {
      await startModule();
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start module:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeModule(timeSpent);
      onProgressUpdate();
    } catch (err) {
      console.error('Failed to complete module:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
            {module.description && <p className="text-gray-600 mt-2">{module.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{module.content_markdown}</div>
          </div>
        </div>

        {/* Progress Bar and Stats */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Time Spent</p>
              <p className="text-lg font-bold text-gray-900">{formatTime(timeSpent)}</p>
            </div>
            {module.estimated_duration_minutes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Time</p>
                <p className="text-lg font-bold text-gray-900">{module.estimated_duration_minutes} min</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Type</p>
              <p className="text-lg font-bold text-gray-900">{module.module_type}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {module.estimated_duration_minutes && (
            <div className="mb-6">
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((timeSpent / (module.estimated_duration_minutes * 60)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {Math.min((timeSpent / (module.estimated_duration_minutes * 60)) * 100, 100).toFixed(0)}% of estimated time
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {progress?.status === 'COMPLETED' ? (
              <button
                disabled
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded font-medium cursor-default"
              >
                ✓ Completed
              </button>
            ) : progress?.status === 'NOT_STARTED' || !progress ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Starting...' : 'Start Module'}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
