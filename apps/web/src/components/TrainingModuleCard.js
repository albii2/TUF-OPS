import React from 'react';
export default function TrainingModuleCard({ module, progress, onSelect }) {
    const isCompleted = progress?.status === 'COMPLETED';
    const isStarted = progress?.status === 'IN_PROGRESS';
    const statusText = isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Not Started';
    const statusColor = isCompleted ? 'text-emerald-400 font-bold' : isStarted ? 'text-cyan-400 font-bold' : 'text-slate-500 font-semibold';
    return (<div onClick={onSelect} className="p-6 bg-[#070c13]/60 rounded-xl border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] transition-all cursor-pointer flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-black text-slate-100 line-clamp-2 text-base tracking-tight">{module.title}</h3>
            <p className={`text-xs mt-1 uppercase tracking-wider ${statusColor}`}>{statusText}</p>
          </div>
          {isCompleted && <span className="text-emerald-400 text-lg font-bold">✓</span>}
        </div>

        {/* Description */}
        {module.description && (<p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{module.description}</p>)}
      </div>

      <div>
        {/* Module Type and Duration */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="inline-block px-2.5 py-0.5 bg-slate-800/60 border border-slate-700/40 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
            {module.module_type}
          </span>
          {module.estimated_duration_minutes && (<span className="flex items-center gap-1">⏱️ {module.estimated_duration_minutes} min</span>)}
        </div>

        {/* Progress Bar */}
        {isStarted && progress?.time_spent_seconds !== undefined && (<div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Spent</span>
              <span className="text-xs text-slate-400 font-mono">
                {Math.floor(progress.time_spent_seconds / 60)}m
                {progress.time_spent_seconds % 60}s
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all shadow-[0_0_8px_rgba(6,182,212,0.5)]" style={{
                width: `${Math.min((progress.time_spent_seconds / ((module.estimated_duration_minutes || 20) * 60)) * 100, 100)}%`,
            }}/>
            </div>
          </div>)}

        {/* CTA Button */}
        <button className={`w-full px-4 py-2.5 rounded-lg font-bold text-xs transition-all border ${isCompleted
            ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
            : isStarted
                ? 'bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-[#0b131f] border-slate-800 text-cyan-400 hover:border-cyan-500/50 hover:bg-[#0f1b2d]'}`}>
          {isCompleted ? 'Review Content' : isStarted ? 'Continue Module' : 'Start Module'}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=TrainingModuleCard.js.map