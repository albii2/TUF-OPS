import React, { useState } from 'react';
import { TrainingEnrollmentWithProgress, TrainingModule, TrainingProgress } from '../hooks/useTrainingEnrollment';
import TrainingModuleCard from './TrainingModuleCard';
import TrainingModuleDetail from './TrainingModuleDetail';

interface TrainingPhaseViewProps {
  phase: string;
  enrollment: TrainingEnrollmentWithProgress;
  userId: number | string;
}

export default function TrainingPhaseView({ phase, enrollment, userId }: TrainingPhaseViewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  const modulesInPhase = enrollment.modules.filter((m) => m.phase === phase);
  const selectedModule = modulesInPhase.find((m) => m.id === selectedModuleId);

  return (
    <div>
      {/* Module Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modulesInPhase.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600">
            No modules available for this phase yet.
          </div>
        ) : (
          modulesInPhase.map((module) => {
            const progress = enrollment.progress.find((p) => p.module_id === module.id);
            return (
              <TrainingModuleCard
                key={module.id}
                module={module}
                progress={progress}
                onSelect={() => setSelectedModuleId(module.id)}
              />
            );
          })
        )}
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <TrainingModuleDetail
          module={selectedModule}
          enrollment={enrollment.enrollment}
          progress={enrollment.progress.find((p) => p.module_id === selectedModule.id)}
          onClose={() => setSelectedModuleId(null)}
          onProgressUpdate={() => {
            // Refetch enrollment data
            setSelectedModuleId(null);
          }}
        />
      )}
    </div>
  );
}
