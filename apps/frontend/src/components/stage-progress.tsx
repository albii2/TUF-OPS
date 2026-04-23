'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OPPORTUNITY_STAGES } from '@/lib/v1';

interface StageProgressProps {
  currentStage: string;
}

export function StageProgress({ currentStage }: StageProgressProps) {
  const currentIndex = OPPORTUNITY_STAGES.indexOf(currentStage as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunity Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 overflow-x-auto pb-4">
          {OPPORTUNITY_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={stage} className="flex items-center space-x-2">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <p className={`text-[10px] text-center mt-1 ${isCurrent ? 'font-bold' : ''}`}>
                    {stage}
                  </p>
                </div>
                {index < OPPORTUNITY_STAGES.length - 1 && (
                  <div className={`h-1 w-10 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
