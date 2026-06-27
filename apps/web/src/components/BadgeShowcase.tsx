import { type BadgeCategory, type RepStats, getBadgeProgress, getCategoryLabel, getCategoryColor } from '../lib/achievements';
import { AchievementBadge } from './AchievementBadge';

interface BadgeShowcaseProps {
  stats: RepStats;
}

export function BadgeShowcase({ stats }: BadgeShowcaseProps) {
  const allProgress = getBadgeProgress(stats);

  const categories: BadgeCategory[] = ['academy', 'territory', 'pipeline', 'lanes'];

  const earned = allProgress.filter((p) => p.earned).length;
  const total = allProgress.length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm">
        <span className="font-semibold text-slate-200">
          🏅 Badges Earned
        </span>
        <span className="text-slate-300">
          <span className="text-cyan-300 font-bold">{earned}</span>
          <span className="text-slate-500"> / {total}</span>
        </span>
      </div>

      {/* Category sections */}
      {categories.map((category) => {
        const catBadges = allProgress.filter((p) => p.badge.category === category);
        const catEarned = catBadges.filter((p) => p.earned).length;
        const catTotal = catBadges.length;

        return (
          <div key={category}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${getCategoryColor(category)}`}
              >
                {getCategoryLabel(category)}
              </span>
              <span className="text-xs text-slate-400">
                {catEarned}/{catTotal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {catBadges.map(({ badge, earned, progress }) => (
                <AchievementBadge
                  key={badge.id}
                  badge={badge}
                  earned={earned}
                  progress={progress}
                  size="md"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
