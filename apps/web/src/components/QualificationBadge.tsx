import type { Qualification, MetalTier, QualificationProgress } from '../lib/achievements';
import { getCollectionConfig } from '../lib/achievements';

interface QualificationBadgeProps {
  qualification: Qualification;
  earnedTier: MetalTier | null;
  progress?: QualificationProgress;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_METAL: Record<MetalTier, { bg: string; border: string; text: string }> = {
  bronze: {
    bg: 'bg-amber-900/40',
    border: 'border-amber-700/60',
    text: 'text-amber-400',
  },
  silver: {
    bg: 'bg-slate-500/20',
    border: 'border-slate-400/40',
    text: 'text-slate-300',
  },
  gold: {
    bg: 'bg-amber-600/20',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
  },
  black: {
    bg: 'bg-black/60',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

const LOCKED_STYLE = 'border-[#1a1a2e]/70 bg-[#0d0d1a] text-slate-600';

function ShapeSVG({ shape, accent, earned, size }: { shape: string; accent: string; earned: boolean; size: string }) {
  const dims = size === 'sm' ? 32 : size === 'lg' ? 56 : 40;
  const strokeColor = earned ? accent : '#334155';
  const fillColor = earned ? `${accent}15` : 'transparent';
  const mid = dims / 2;
  const r = dims / 2 - 2;

  switch (shape) {
    case 'shield':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <path
            d="M20 2L36 10V20C36 30 28 37 20 38C12 37 4 30 4 20V10L20 2Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'chevron':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <path
            d="M20 4L36 20L20 36L4 20L20 4Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            transform="rotate(45 20 20)"
          />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <polygon
            points="20,2 37,11 37,29 20,38 3,29 3,11"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'compass':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r={r} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <path d="M20 6L24 20L20 34L16 20L20 6Z" fill={earned ? accent : '#334155'} opacity={earned ? 0.4 : 0.3} />
          <line x1="20" y1="6" x2="20" y2="34" stroke={strokeColor} strokeWidth="0.8" />
          <line x1="6" y1="20" x2="34" y2="20" stroke={strokeColor} strokeWidth="0.8" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <polygon
            points="20,3 37,20 20,37 3,20"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'star':
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <polygon
            points="20,3 24,15 37,15 27,23 30,36 20,28 10,36 13,23 3,15 16,15"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
      );
    default:
      return (
        <svg width={dims} height={dims} viewBox="0 0 40 40" fill="none">
          <circle cx={mid} cy={mid} r={r} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );
  }
}

export function QualificationBadge({
  qualification,
  earnedTier,
  progress,
  size = 'md',
}: QualificationBadgeProps) {
  const collection = getCollectionConfig(qualification.collection);
  const earned = earnedTier !== null;
  const metal = earnedTier ? TIER_METAL[earnedTier] : null;
  const isBlack = earnedTier === 'black';

  const sizeClasses = {
    sm: 'w-[72px] min-h-[90px]',
    md: 'w-[120px] min-h-[160px]',
    lg: 'w-[160px] min-h-[210px]',
  };

  const progressPct = progress
    ? Math.round(
        (progress.tierProgress.filter((t) => t.unlocked).length / progress.tierProgress.length) * 100,
      )
    : 0;

  return (
    <div
      className={`relative flex flex-col items-center rounded-lg border p-3 transition-all duration-300 ${
        earned
          ? isBlack
            ? 'border-[#1a1a2e] bg-[#0a0a16]'
            : `${metal?.border ?? ''} ${metal?.bg ?? ''}`
          : LOCKED_STYLE
      } ${sizeClasses[size]}`}
    >
      {/* Light sweep animation on newly earned */}
      {earned && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
          <div
            className="absolute inset-0 animate-light-sweep opacity-0"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${collection.accent}20 50%, transparent 60%)`,
              animation: 'lightSweep 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Shape icon */}
      <div className="mb-2 mt-1 flex items-center justify-center">
        <ShapeSVG shape={qualification.shape} accent={collection.accent} earned={earned} size={size} />
      </div>

      {/* Name — ALL CAPS condensed */}
      <span
        className={`text-center text-[10px] font-bold uppercase tracking-[0.15em] leading-tight ${
          earned ? (isBlack ? 'text-amber-400' : 'text-slate-200') : 'text-slate-600'
        }`}
      >
        {qualification.name}
      </span>

      {/* Tier label */}
      <span
        className={`mt-1 rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
          earned
            ? isBlack
              ? 'border-amber-500/30 bg-black/40 text-amber-400'
              : `${metal?.border ?? ''} ${metal?.bg ?? ''} ${metal?.text ?? ''}`
            : 'border-slate-700/50 text-slate-600'
        }`}
      >
        {earned ? earnedTier!.toUpperCase() : 'LOCKED'}
      </span>

      {/* Collection label */}
      <span
        className="mt-1 text-[7px] font-medium uppercase tracking-[0.2em] text-slate-500"
      >
        {collection.label}
      </span>

      {/* Tier progress dots */}
      {size !== 'sm' && (
        <div className="mt-2 flex gap-1">
          {['bronze', 'silver', 'gold', 'black'].map((t) => {
            const tierOrder = ['bronze', 'silver', 'gold', 'black'].indexOf(t);
            const earnedOrder = earnedTier ? ['bronze', 'silver', 'gold', 'black'].indexOf(earnedTier) : -1;
            const isUnlocked = tierOrder <= earnedOrder;
            const tierColor = t === 'black' ? 'bg-[#1a1a2e] border-amber-500/40' : '';
            return (
              <div
                key={t}
                className={`h-1.5 w-1.5 rounded-full border ${
                  isUnlocked
                    ? t === 'black'
                      ? 'border-amber-500/40 bg-amber-500'
                      : t === 'gold'
                        ? 'border-amber-500 bg-amber-400'
                        : t === 'silver'
                          ? 'border-slate-400 bg-slate-300'
                          : 'border-amber-600 bg-amber-600'
                    : `${tierColor || 'border-slate-700 bg-slate-800'}`
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Vibration animation trigger class */}
      <style>{`
        @keyframes lightSweep {
          0% { opacity: 0; transform: translateX(-100%); }
          20% { opacity: 0.4; }
          40% { opacity: 0; transform: translateX(100%); }
          100% { opacity: 0; transform: translateX(100%); }
        }
        @keyframes badgeEarnedVibrate {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .badge-earned {
          animation: badgeEarnedVibrate 200ms ease-out;
        }
      `}</style>
    </div>
  );
}
