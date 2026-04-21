
import { FC } from 'react';
import PressureRow from './PressureRow';

interface NextPlaysSectionProps {
  nextPlays: any[]; // Replace with actual type
}

export const NextPlaysSection: FC<NextPlaysSectionProps> = ({ nextPlays }) => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Next Plays</h2>
      <div className="space-y-3">
        {nextPlays.map((play, index) => (
          <PressureRow key={index} play={play} />
        ))}
      </div>
    </div>
  );
};

export default NextPlaysSection;
