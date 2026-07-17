import React from 'react';
import { TrainingModule, TrainingProgress, TrainingEnrollment } from '../hooks/useTrainingEnrollment';
interface TrainingModuleDetailProps {
    module: TrainingModule;
    enrollment: TrainingEnrollment;
    progress?: TrainingProgress;
    onClose: () => void;
    onProgressUpdate: () => void;
}
export default function TrainingModuleDetail({ module, enrollment, progress, onClose, onProgressUpdate, }: TrainingModuleDetailProps): React.JSX.Element;
export {};
//# sourceMappingURL=TrainingModuleDetail.d.ts.map