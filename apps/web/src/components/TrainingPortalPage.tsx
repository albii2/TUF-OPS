import React, { useState } from 'react';
import { useTrainingEnrollment, TrainingPhase } from '../hooks/useTrainingEnrollment';
import TrainingPhaseView from './TrainingPhaseView';
import ProgressRing from './ProgressRing';

const PHASES = ['DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1'];
const PHASE_LABELS: Record<string, string> = {
  DAY_1: 'Day 1',
  DAY_1_2: 'Day 1-2',
  WEEK_1_2: 'Week 1-2',
  MONTH_1: 'Month 1',
};

export default function TrainingPortalPage() {
  const userId = parseInt(localStorage.getItem('tuf_ops_user_id') || '0', 10);
  const { enrollment, loading, error } = useTrainingEnrollment(userId);
  const [selectedPhase, setSelectedPhase] = useState<string>('DAY_1');

  if (loading) {
    return <div className="p-8">Loading training portal...</div>;
  }

  if (error || !enrollment) {
    return <div className="p-8 text-red-600">Error loading training portal: {error}</div>;
  }

  const { enrollment: enrollmentData, completionMetrics } = enrollment;
  const currentPhaseIndex = PHASES.indexOf(enrollmentData.current_phase);
  const visiblePhases = PHASES.slice(0, currentPhaseIndex + 2);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Portal</h1>
            <p className="text-gray-600 mt-2">
              {enrollmentData.role} Curriculum • Current Phase: {PHASE_LABELS[enrollmentData.current_phase]}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing percentage={completionMetrics.percentComplete} size={120} strokeWidth={8} />
            <p className="text-sm text-gray-600 mt-2">{completionMetrics.percentComplete}% Complete</p>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {visiblePhases.map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={`px-4 py-3 font-medium transition-colors ${
                selectedPhase === phase
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>

        {/* Phase Completion Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {PHASES.map((phase) => {
            const status = completionMetrics.phaseCompletionStatus[phase];
            const isUnlocked = PHASES.indexOf(phase) <= currentPhaseIndex + 1;
            return (
              <div
                key={phase}
                className={`p-4 rounded-lg ${
                  isUnlocked
                    ? status.percentComplete === 100
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-100 border border-gray-200 opacity-50'
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{PHASE_LABELS[phase]}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {status.completed}/{status.total}
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      status.percentComplete === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${status.percentComplete}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modules for Selected Phase */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">{PHASE_LABELS[selectedPhase]} Modules</h2>
          <TrainingPhaseView
            phase={selectedPhase}
            enrollment={enrollment}
            userId={userId}
          />
        </div>

        {/* Completion Message */}
        {enrollmentData.status === 'COMPLETED' && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900">🎉 Congratulations!</h3>
            <p className="text-green-800 mt-2">
              You have completed all training modules. Welcome to the team!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
