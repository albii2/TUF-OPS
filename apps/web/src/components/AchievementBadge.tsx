import type { Badge } from '../lib/achievements';
import { getTierColor } from '../lib/achievements';

interface AchievementBadgeProps {
  badge: Badge;
  earned: boolean;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ badge, earned, progress = 0, size = 'md' }: AchievementBadgeProps) {
  const tierColorClass = getTierColor(badge.tier);

  const sizeClasses = {
    sm: 'w-14 h-14 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-28 h-28 text-base',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition-all ${
        earned
          ? `${tierColorClass} shadow-lg shadow-current/10`
          : 'border-slate-700/50 bg-slate-800/30 text-slate-500 opacity-60'
      } ${sizeClasses[size]}`}
      title={badge.description}
    >
      {/* Icon */}
      <span
        className={`${iconSizes[size]} ${earned ? '' : 'grayscale'} transition-transform hover:scale-110`}
      >
        {badge.icon}
      </span>

      {/* Name */}
      {size !== 'sm' && (
        <span
          className={`mt-1 text-center font-semibold leading-tight ${
            earned ? 'text-slate-100' : 'text-slate-500'
          }`}
        >
          {badge.name}
        </span>
      )}

      {/* Tier label */}
      <span
        className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
          earned ? tierColorClass : 'border-slate-700 text-slate-600'
        }`}
      >
        {badge.tier}
      </span>

      {/* Progress bar for unearned badges */}
      {!earned && progress > 0 && (
        <div className="absolute bottom-1 left-2 right-2">
          <div className="h-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-slate-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Earned checkmark */}
      {earned && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
          ✓
        </span>
      )}
    </div>
  );
}
