import React from 'react';
export default function ProgressRing({ percentage, size = 100, strokeWidth = 4, color = '#3b82f6', }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (<div className="flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}/>
        {/* Progress circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-500"/>
      </svg>
      {/* Percentage text */}
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
      </div>
    </div>);
}
//# sourceMappingURL=ProgressRing.js.map