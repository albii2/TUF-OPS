import { useEffect, useMemo, useState } from 'react';

type League =
  | 'NBA'
  | 'NFL'
  | 'MLB'
  | 'NHL'
  | 'CFB'
  | 'MLS'
  | 'WNBA'
  | 'NCAAM';

type GameSlot = {
  league: League;
  matchup: string;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  gameTime?: string;
  isMNTeam: boolean;
  leagueLabel: string;
};

type WireLink = {
  label: string;
  href: string;
};

// ─── ESPN API URLs ──────────────────────────────────────────────────────────

const ESPN_SCOREBOARD_URLS: Record<League, string> = {
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  CFB: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  MLS: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
  WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
  NCAAM: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
};

const LEAGUE_LABELS: Record<League, string> = {
  NBA: '🏀 NBA',
  NFL: '🏈 NFL',
  MLB: '⚾ MLB',
  NHL: '🏒 NHL',
  CFB: '🏈 NCAA FB',
  MLS: '⚽ MLS',
  WNBA: '🏀 WNBA',
  NCAAM: '🏀 NCAA MBB',
};

// ─── Minnesota Teams ────────────────────────────────────────────────────────

const MN_TEAM_NAMES: string[] = [
  'Twins',
  'Vikings',
  'Timberwolves',
  'Wild',
  'Lynx',
  'Gophers',
  'Minnesota',
  'MIN',
  'MINN',
  'Golden Gophers',
];

function isMNTeam(name: string): boolean {
  const upper = name.toUpperCase();
  return MN_TEAM_NAMES.some((team) => upper.includes(team.toUpperCase()));
}

// ─── Wire Links ─────────────────────────────────────────────────────────────

const sportsWireLinks: WireLink[] = [
  { label: 'Sports Business Journal', href: 'https://www.sportsbusinessjournal.com/' },
  { label: 'Front Office Sports', href: 'https://frontofficesports.com/' },
  { label: 'NCAA News', href: 'https://www.ncaa.org/news/' },
  { label: 'WNBA News', href: 'https://www.wnba.com/news/' },
];

// ─── Default leagues (used if settings not set) ─────────────────────────────

const DEFAULT_LEAGUES: League[] = ['NBA', 'NFL', 'MLB', 'NHL'];

function getSelectedLeagues(): League[] {
  try {
    const raw = localStorage.getItem('tuf_ops_settings_v2');
    if (raw) {
      const prefs = JSON.parse(raw);
      if (prefs?.favoriteLeagues && Array.isArray(prefs.favoriteLeagues)) {
        const valid = prefs.favoriteLeagues.filter(
          (l: string) => l in ESPN_SCOREBOARD_URLS
        ) as League[];
        if (valid.length > 0) return valid;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LEAGUES;
}

// ─── Refresh interval ───────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 300_000; // 5 minutes

// ─── Styles (injected as <style>) ───────────────────────────────────────────

const MARQUEE_STYLE_ID = 'tuf-sports-marquee-style';

function injectMarqueeStyles() {
  if (document.getElementById(MARQUEE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = MARQUEE_STYLE_ID;
  style.textContent = `
    @keyframes tuf-marquee-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .tuf-marquee-track {
      animation: tuf-marquee-scroll 60s linear infinite;
    }
    .tuf-marquee-track:hover {
      animation-play-state: paused;
    }
    @keyframes tuf-live-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .tuf-live-dot {
      animation: tuf-live-pulse 1.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SportsTicker() {
  const [scoreSlots, setScoreSlots] = useState<GameSlot[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('—');
  const [selectedLeagues, setSelectedLeagues] = useState<League[]>(DEFAULT_LEAGUES);

  // Inject CSS
  useEffect(() => {
    injectMarqueeStyles();
    return () => {
      const el = document.getElementById(MARQUEE_STYLE_ID);
      if (el) el.remove();
    };
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorage = () => setSelectedLeagues(getSelectedLeagues());
    const handleSettingsChanged = () => setSelectedLeagues(getSelectedLeagues());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('tuf:settings-changed', handleSettingsChanged);
    // Also read initially
    setSelectedLeagues(getSelectedLeagues());
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tuf:settings-changed', handleSettingsChanged);
    };
  }, []);

  // Fetch scores
  useEffect(() => {
    let cancelled = false;

    const loadScores = async () => {
      const results = await Promise.all(
        selectedLeagues.map(async (league) => {
          try {
            const resp = await fetch(ESPN_SCOREBOARD_URLS[league]);
            if (!resp.ok) throw new Error(`ESPN ${league} status ${resp.status}`);
            const payload = (await resp.json()) as {
              events?: Array<{
                shortName?: string;
                name?: string;
                status?: {
                  type?: {
                    state?: string;
                    completed?: boolean;
                    shortDetail?: string;
                    detail?: string;
                  };
                };
                competitions?: Array<{
                  competitors?: Array<{
                    team?: { displayName?: string; shortDisplayName?: string };
                  }>;
                  date?: string;
                  status?: {
                    type?: {
                      state?: string;
                      completed?: boolean;
                      shortDetail?: string;
                    };
                  };
                }>;
              }>;
            };

            const events = payload.events ?? [];

            // Map events to game slots
            const gameSlots: GameSlot[] = events.map((event) => {
              const comp = event.competitions?.[0];
              const statusType = comp?.status?.type ?? event.status?.type;
              const state = statusType?.state ?? '';
              const completed = statusType?.completed ?? false;
              const isLive = state === 'in';
              const isFinal = completed || state === 'post';

              const teams =
                comp?.competitors
                  ?.map((c) => c.team?.shortDisplayName ?? c.team?.displayName ?? '')
                  .join(' vs ') ?? event.shortName ?? event.name ?? 'Unknown Matchup';

              const mnTeam =
                isMNTeam(event.name ?? '') ||
                (comp?.competitors ?? []).some(
                  (c) =>
                    isMNTeam(c.team?.displayName ?? '') ||
                    isMNTeam(c.team?.shortDisplayName ?? '')
                );

              // Game time for upcoming games
              let gameTime: string | undefined;
              if (!isLive && !isFinal && comp?.date) {
                const d = new Date(comp.date);
                gameTime = d.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });
              }

              const statusText = statusType?.shortDetail ?? (isFinal ? 'Final' : isLive ? 'Live' : 'Upcoming');

              return {
                league,
                matchup: teams,
                status: statusText,
                isLive,
                isFinal,
                gameTime,
                isMNTeam: mnTeam,
                leagueLabel: LEAGUE_LABELS[league],
              };
            });

            return gameSlots;
          } catch {
            return [
              {
                league,
                matchup: 'Feed unavailable',
                status: 'ESPN sync failed',
                isLive: false,
                isFinal: false,
                isMNTeam: false,
                leagueLabel: LEAGUE_LABELS[league],
              },
            ] as GameSlot[];
          }
        })
      );

      if (!cancelled) {
        setScoreSlots(results.flat());
        const now = new Date();
        const hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        setLastUpdated(
          `${displayHours}:${now.getMinutes().toString().padStart(2, '0')} ${ampm} CST`
        );
      }
    };

    loadScores();
    const timer = window.setInterval(loadScores, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedLeagues]);

  // ── Build ticker items ────────────────────────────────────────────────────

  const tickerItems = useMemo(() => {
    const scoreItems = scoreSlots.map((game) => ({
      type: 'game' as const,
      leagueLabel: game.leagueLabel,
      matchup: game.matchup,
      status: game.status,
      isLive: game.isLive,
      isFinal: game.isFinal,
      gameTime: game.gameTime,
      isMNTeam: game.isMNTeam,
    }));

    const wireItems = sportsWireLinks.map((link) => ({
      type: 'wire' as const,
      label: link.label,
      href: link.href,
    }));

    return [...scoreItems, ...wireItems];
  }, [scoreSlots]);

  // ── Duplicate items for seamless marquee ──────────────────────────────────

  const marqueeContent = useMemo(() => {
    // Duplicate for seamless looping
    const doubled = [...tickerItems, ...tickerItems];

    return doubled.map((item, index) => {
      if (item.type === 'wire') {
        return (
          <span
            key={`wire-${item.label}-${index}`}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100">
              WIRE
            </span>
            <span className="font-medium text-slate-300">{item.label}</span>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline decoration-cyan-700/70 underline-offset-2 hover:text-cyan-200"
            >
              Open
            </a>
          </span>
        );
      }

      // Game item
      return (
        <span
          key={`game-${item.leagueLabel}-${item.matchup}-${index}`}
          className="inline-flex items-center gap-2 whitespace-nowrap"
        >
          {/* League badge */}
          <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
            {item.leagueLabel}
          </span>

          {/* Live / Final indicator */}
          {item.isLive && (
            <span className="tuf-live-dot inline-block h-2 w-2 rounded-full bg-emerald-400" title="Live" />
          )}
          {item.isFinal && (
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" title="Final" />
          )}

          {/* MN Badge */}
          {item.isMNTeam && (
            <span className="rounded border border-purple-500/40 bg-purple-500/15 px-1 py-0.5 text-[9px] font-bold text-purple-300">
              MN
            </span>
          )}

          {/* Matchup */}
          <span className="font-medium text-slate-200">{item.matchup}</span>

          {/* Status / Game time */}
          {item.gameTime ? (
            <span className="text-slate-400">{item.gameTime}</span>
          ) : null}
          <span
            className={`text-[11px] ${
              item.isLive
                ? 'text-emerald-400 font-semibold'
                : item.isFinal
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {item.status}
          </span>
        </span>
      );
    });
  }, [tickerItems]);

  if (selectedLeagues.length === 0 && tickerItems.filter((t) => t.type === 'game').length === 0) {
    return null; // Don't show ticker if no leagues selected
  }

  return (
    <div className="mb-2 w-full min-w-0 overflow-hidden rounded-md border border-[#12314a] bg-[#07111b] text-xs text-slate-200">
      <div className="flex items-center">
        {/* Left fixed elements */}
        <a
          href="https://tufsports.us"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border-r border-[#12314a] bg-[#0b1a28] px-3 py-2 font-semibold text-cyan-200 hover:bg-[#0f2a41] z-10"
        >
          TUF Sports
        </a>
        <span className="shrink-0 border-r border-[#12314a] px-3 py-2 text-[10px] text-slate-400 z-10">
          Updated {lastUpdated}
        </span>

        {/* Marquee area */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="tuf-marquee-track flex w-max items-center gap-6 py-2">
            {marqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
}
