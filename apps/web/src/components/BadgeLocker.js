import { useState } from 'react';
import { getCollectionSummary, getTierLabel, getTierOrder, } from '../lib/achievements';
import { QualificationBadge } from './QualificationBadge';
const TIER_BAR_COLORS = {
    bronze: 'bg-amber-700',
    silver: 'bg-slate-400',
    gold: 'bg-amber-500',
    black: 'bg-[#1a1a2e]',
};
export function BadgeLocker({ stats }) {
    const summary = getCollectionSummary(stats);
    const totalEarned = summary.reduce((sum, c) => sum + c.earned, 0);
    const total = summary.reduce((sum, c) => sum + c.total, 0);
    const [expandedCollection, setExpandedCollection] = useState(null);
    return (<div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded border border-slate-700/50 bg-[#0d0d1a] px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
          QUALIFICATIONS
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">EARNED</span>
          <span className="text-sm font-bold text-slate-200">
            {totalEarned}
          </span>
          <span className="text-xs text-slate-600">/</span>
          <span className="text-xs text-slate-500">{total}</span>
        </div>
      </div>

      {/* Collection rows */}
      <div className="space-y-1">
        {summary.map(({ collection, earned, total: colTotal, progress }) => {
            const isExpanded = expandedCollection === collection.id;
            const pct = colTotal > 0 ? Math.round((earned / colTotal) * 100) : 0;
            return (<div key={collection.id}>
              {/* Collection header row */}
              <button onClick={() => setExpandedCollection(isExpanded ? null : collection.id)} className="flex w-full items-center gap-3 rounded border border-slate-800 bg-[#0a0a16] px-4 py-3 text-left transition-colors hover:border-slate-700">
                {/* Collection accent bar */}
                <div className="h-8 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: collection.accent }}/>

                {/* Label + description */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                      {collection.label}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {collection.description}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${pct}%`,
                    backgroundColor: collection.accent,
                }}/>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {earned}/{colTotal}
                  </span>
                </div>

                {/* Expand indicator */}
                <span className="text-[10px] text-slate-600">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded badge grid */}
              {isExpanded && (<div className="border-x border-b border-slate-800 bg-[#060610] px-4 py-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {progress.map((qp) => (<div key={qp.qualification.id} className="space-y-2">
                        <QualificationBadge qualification={qp.qualification} earnedTier={qp.earnedTier} progress={qp} size="md"/>

                        {/* CoD-style tier progression bar */}
                        <div className="space-y-0.5">
                          {qp.tierProgress.map((tp) => {
                            const tierOrder = getTierOrder(tp.tier);
                            const earnedOrder = qp.earnedTier
                                ? getTierOrder(qp.earnedTier)
                                : -1;
                            const barColor = tierOrder <= earnedOrder
                                ? tp.tier === 'black'
                                    ? 'bg-[#1a1a2e]'
                                    : tp.tier === 'gold'
                                        ? 'bg-amber-500'
                                        : tp.tier === 'silver'
                                            ? 'bg-slate-400'
                                            : 'bg-amber-700'
                                : 'bg-slate-800';
                            const isCurrentTier = !qp.earnedTier
                                ? tierOrder === 0
                                : tierOrder === earnedOrder + 1;
                            return (<div key={tp.tier} className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-bold uppercase tracking-widest w-10 text-right ${tp.unlocked
                                    ? tp.tier === 'black'
                                        ? 'text-amber-400'
                                        : 'text-slate-400'
                                    : 'text-slate-600'}`}>
                                  {getTierLabel(tp.tier)}
                                </span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                                  <div className={`h-full rounded-full transition-all duration-500 ${tp.unlocked
                                    ? barColor
                                    : isCurrentTier && tp.percent > 0
                                        ? 'bg-slate-600'
                                        : barColor}`} style={{ width: `${tp.unlocked ? 100 : isCurrentTier ? tp.percent : 0}%` }}/>
                                </div>
                                <span className={`text-[8px] font-mono tabular-nums w-8 ${tp.unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {tp.unlocked ? '✓' : `${tp.percent}%`}
                                </span>
                              </div>);
                        })}
                        </div>

                        {/* Earned date */}
                        {qp.earnedAt && (<div className="text-center text-[7px] uppercase tracking-wider text-slate-500">
                            UNLOCKED{' '}
                            {new Date(qp.earnedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                          </div>)}
                      </div>))}
                  </div>
                </div>)}
            </div>);
        })}
      </div>
    </div>);
}
//# sourceMappingURL=BadgeLocker.js.map