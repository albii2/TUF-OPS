import { useEffect, useMemo, useState } from 'react';

type League = 'NBA' | 'NFL' | 'CFB' | 'WNBA';

type ScoreSlot = {
  league: League;
  matchup: string;
  status: string;
};

type WireLink = {
  label: string;
  href: string;
};

const ESPN_SCOREBOARD_URLS: Record<League, string> = {
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  CFB: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
};

const sportsWireLinks: WireLink[] = [
  { label: 'Sports Business Journal', href: 'https://www.sportsbusinessjournal.com/' },
  { label: 'Front Office Sports', href: 'https://frontofficesports.com/' },
  { label: 'NCAA News', href: 'https://www.ncaa.org/news/' },
  { label: 'WNBA News', href: 'https://www.wnba.com/news/' },
];

export function SportsTicker() {
  const [scoreSlots, setScoreSlots] = useState<ScoreSlot[]>([
    { league: 'NBA', matchup: 'Loading ESPN feed…', status: 'Syncing' },
    { league: 'NFL', matchup: 'Loading ESPN feed…', status: 'Syncing' },
    { league: 'CFB', matchup: 'Loading ESPN feed…', status: 'Syncing' },
    { league: 'WNBA', matchup: 'Loading ESPN feed…', status: 'Syncing' },
  ]);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  useEffect(() => {
    const loadScores = async () => {
      const leagues: League[] = ['NBA', 'NFL', 'CFB', 'WNBA'];
      const results = await Promise.all(
        leagues.map(async (league) => {
          try {
            const resp = await fetch(ESPN_SCOREBOARD_URLS[league]);
            if (!resp.ok) throw new Error(`ESPN ${league} status ${resp.status}`);
            const payload = await resp.json() as {
              events?: Array<{
                shortName?: string;
                status?: { type?: { shortDetail?: string } };
              }>;
            };
            const first = payload.events?.[0];
            return {
              league,
              matchup: first?.shortName ?? 'No active matchup',
              status: first?.status?.type?.shortDetail ?? 'Awaiting game window',
            } as ScoreSlot;
          } catch {
            return { league, matchup: 'Feed unavailable', status: 'ESPN sync failed' } as ScoreSlot;
          }
        }),
      );
      setScoreSlots(results);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };

    loadScores();
    const timer = window.setInterval(loadScores, 120000);
    return () => window.clearInterval(timer);
  }, []);

  const tickerItems = useMemo(
    () => [
      ...scoreSlots.map((score) => ({
        tag: score.league,
        label: score.matchup,
        status: `${score.status} · ESPN`,
      })),
      ...sportsWireLinks.map((link) => ({ tag: 'WIRE', label: link.label, status: 'Open source', href: link.href })),
    ],
    [scoreSlots],
  );

  return (
    <div className="mb-2 w-full min-w-0 overflow-hidden rounded-md border border-[#12314a] bg-[#07111b] text-xs text-slate-200">
      <div className="flex items-center">
        <a href="https://tufsports.us" target="_blank" rel="noopener noreferrer" className="shrink-0 border-r border-[#12314a] bg-[#0b1a28] px-3 py-2 font-semibold text-cyan-200 hover:bg-[#0f2a41]">TUF Sports Website</a>
        <span className="shrink-0 border-r border-[#12314a] px-3 py-2 text-[10px] text-slate-400">Updated {lastUpdated}</span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-6 py-2">
            {tickerItems.map((item, index) => (
              <span key={`${item.tag}-${item.label}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${item.tag === 'WIRE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'}`}>{item.tag}</span>
                <span className="font-medium">{item.label}</span>
                {item.tag === 'WIRE' && item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline decoration-cyan-700/70 underline-offset-2 hover:text-cyan-200">
                    {item.status}
                  </a>
                ) : (
                  <span className="text-slate-400">{item.status}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
