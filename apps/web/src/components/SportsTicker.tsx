import { useEffect, useMemo, useState } from 'react';

type ScoreItem = {
  league: 'NBA' | 'NFL' | 'CFB';
  label: string;
  status: string;
};

const fallbackScores: ScoreItem[] = [
  { league: 'NBA', label: 'NBA Playoffs scoreboard feed warming up', status: 'Refreshes in app' },
  { league: 'NFL', label: 'NFL scoreboard: no active games in current window', status: 'Offseason' },
  { league: 'CFB', label: 'College football scoreboard: no active games in current window', status: 'Offseason' },
];

const feeds: Array<{ league: ScoreItem['league']; url: string }> = [
  { league: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { league: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { league: 'CFB', url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard' },
];

function formatEvent(league: ScoreItem['league'], event: any): ScoreItem | null {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  if (competitors.length < 2) return null;

  const away = competitors.find((team: any) => team.homeAway === 'away') ?? competitors[0];
  const home = competitors.find((team: any) => team.homeAway === 'home') ?? competitors[1];
  const awayName = away?.team?.abbreviation ?? away?.team?.shortDisplayName ?? 'AWAY';
  const homeName = home?.team?.abbreviation ?? home?.team?.shortDisplayName ?? 'HOME';
  const awayScore = away?.score ?? '0';
  const homeScore = home?.score ?? '0';
  const status = event?.status?.type?.shortDetail ?? event?.status?.type?.description ?? 'Scheduled';

  return {
    league,
    label: `${awayName} ${awayScore} @ ${homeName} ${homeScore}`,
    status,
  };
}

export function SportsTicker() {
  const [scores, setScores] = useState<ScoreItem[]>(fallbackScores);

  useEffect(() => {
    let cancelled = false;

    async function loadScores() {
      const settled = await Promise.allSettled(
        feeds.map(async (feed) => {
          const response = await fetch(feed.url);
          if (!response.ok) throw new Error(feed.league);
          const data = await response.json();
          return (data.events ?? []).map((event: any) => formatEvent(feed.league, event)).filter(Boolean) as ScoreItem[];
        }),
      );

      if (cancelled) return;
      const next = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
      if (next.length) setScores(next.slice(0, 18));
    }

    loadScores().catch(() => undefined);
    const timer = window.setInterval(loadScores, 1000 * 60 * 5);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tickerItems = useMemo(() => [...scores, ...scores], [scores]);

  return (
    <div className="mb-2 overflow-hidden rounded-md border border-[#12314a] bg-[#07111b] text-xs text-slate-200">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-[#12314a] bg-[#0b1a28] px-3 py-2 font-semibold text-cyan-200">National Scoreboard</div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-6 py-2">
            {tickerItems.map((item, index) => (
              <span key={`${item.league}-${item.label}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">{item.league}</span>
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
