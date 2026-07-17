import React from 'react';
import { TrainingModule, TrainingProgress } from '../hooks/useTrainingEnrollment';
interface TrainingModuleCardProps {
    module: TrainingModule;
    progress?: TrainingProgress;
    onSelect: () => void;
}
export default function TrainingModuleCard({ module, progress, onSelect }: TrainingModuleCardProps): React.JSX.Element;
export {};
//# sourceMappingURL=TrainingModuleCard.d.ts.map