/**
 * Current Campaign — Fall/Winter 2026.
 * Rep-facing visibility for the season directive (Sept 1).
 * Copy stays inside the fixed TUF lane vocabulary:
 * Uniforms · Travel Gear · Team Stores · Letterman Jackets.
 */

const CAMPAIGN_TIERS = [
  {
    tier: 'TIER 1',
    label: 'Primary conversation opener',
    items: ['Letterman Jackets', 'Team Stores'],
    note: 'Lead every conversation here — this is where Fall/Winter 2026 starts.',
    tone: 'border-cyan-500/30 bg-cyan-500/10',
    chip: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100',
    tag: 'text-cyan-300',
  },
  {
    tier: 'TIER 2',
    label: 'Winter uniform programs',
    items: ['Boys Basketball', 'Girls Basketball', 'Wrestling'],
    note: 'Uniform lane push — three winter programs, one uniform conversation.',
    tone: 'border-emerald-500/30 bg-emerald-500/10',
    chip: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100',
    tag: 'text-emerald-300',
  },
  {
    tier: 'TIER 3',
    label: 'Attach gear to every order',
    items: ['Travel Gear', 'Player Gear', 'Coaches Gear'],
    note: 'Add-on business on top of jacket and uniform wins.',
    tone: 'border-amber-500/30 bg-amber-500/10',
    chip: 'border-amber-400/50 bg-amber-400/10 text-amber-100',
    tag: 'text-amber-300',
  },
] as const;

const LANE_CHIPS = ['Uniforms', 'Travel Gear', 'Team Stores', 'Letterman Jackets'] as const;

export function CampaignPanel() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Current Campaign
        </h2>
        <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
          Fall / Winter 2026
        </span>
      </div>

      <div className="space-y-2">
        {CAMPAIGN_TIERS.map((tier) => (
          <div key={tier.tier} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 ${tier.tone}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${tier.tag}`}>{tier.tier}</span>
            <span className="hidden text-xs text-slate-400 sm:inline">·</span>
            <span className="w-full text-xs text-slate-300 sm:w-auto">{tier.label}</span>
            <span className="flex flex-wrap gap-1.5">
              {tier.items.map((item) => (
                <span key={item} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tier.chip}`}>
                  {item}
                </span>
              ))}
            </span>
            <span className="w-full text-[11px] text-slate-400 sm:ml-auto sm:w-auto sm:text-right">{tier.note}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Lanes</span>
        {LANE_CHIPS.map((lane) => (
          <span key={lane} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {lane}
          </span>
        ))}
      </div>
    </div>
  );
}
