import { useMemo } from 'react';

type League = 'NBA' | 'NFL' | 'CFB' | 'WNBA';

type ScoreSlot = {
  league: League;
  matchup: string;
  status: string;
  sourceLabel: string;
  sourceUrl?: string;
};

type WireLink = {
  label: string;
  href: string;
};

const scoreSlots: ScoreSlot[] = [
  { league: 'NBA', matchup: 'Configure live feed slot', status: 'Placeholder', sourceLabel: 'Add API provider in config' },
  { league: 'NFL', matchup: 'Configure live feed slot', status: 'Placeholder', sourceLabel: 'Add API provider in config' },
  { league: 'CFB', matchup: 'Configure live feed slot', status: 'Placeholder', sourceLabel: 'Add API provider in config' },
  { league: 'WNBA', matchup: 'Configure live feed slot', status: 'Placeholder', sourceLabel: 'Add API provider in config' },
];

const sportsWireLinks: WireLink[] = [
  { label: 'Sports Business Journal', href: 'https://www.sportsbusinessjournal.com/' },
  { label: 'Front Office Sports', href: 'https://frontofficesports.com/' },
  { label: 'NCAA News', href: 'https://www.ncaa.org/news/' },
  { label: 'WNBA News', href: 'https://www.wnba.com/news/' },
];

export function SportsTicker() {
  const tickerItems = useMemo(
    () => [
      ...scoreSlots.map((score) => ({
        tag: score.league,
        label: score.matchup,
        status: `${score.status} · ${score.sourceLabel}`,
      })),
      ...sportsWireLinks.map((link) => ({ tag: 'WIRE', label: link.label, status: link.href })),
    ],
    [],
  );

  return (
    <div className="mb-2 w-full min-w-0 overflow-hidden rounded-md border border-[#12314a] bg-[#07111b] text-xs text-slate-200">
      <div className="flex items-center">
        <a href="https://tufsports.us" target="_blank" rel="noopener noreferrer" className="shrink-0 border-r border-[#12314a] bg-[#0b1a28] px-3 py-2 font-semibold text-cyan-200 hover:bg-[#0f2a41]">Game Day Wire</a>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-6 py-2">
            {tickerItems.map((item, index) => (
              <span key={`${item.tag}-${item.label}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${item.tag === 'WIRE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'}`}>{item.tag}</span>
                <span className="font-medium">{item.label}</span>
                <span className="text-slate-400">{item.status}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
