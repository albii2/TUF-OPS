'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TUF_STAGES = [
  'Prospect',
  'Engage',
  'Design the Win',
  'Prove the Gear',
  'Invoice & Secure Payment',
  'Commit to the Team',
  'Execute the Order',
  'Expand the Program'
];

interface StageProgressProps {
  currentStage: string;
}

export function StageProgress({ currentStage }: StageProgressProps) {
  const currentIndex = TUF_STAGES.indexOf(currentStage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 overflow-x-auto pb-4">
          {TUF_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={stage} className="flex items-center space-x-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <p className={`text-xs text-center mt-1 ${isCurrent ? 'font-bold' : ''}`}>
                    {stage}
                  </p>
                </div>
                {index < TUF_STAGES.length - 1 && (
                  <div className={`h-1 w-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
