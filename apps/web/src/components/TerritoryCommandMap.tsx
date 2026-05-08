import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from './ui';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useTerritories } from '../hooks/useTerritory';
import type { RevenueLane, TerritoryId } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';
import { getLaneLabel } from '../utils/naming';

const laneOrder: RevenueLane[] = ['UNIFORM', 'TEAM_STORE', 'TRAVEL_GEAR', 'LETTERMAN'];
const zoneOrder: TerritoryId[] = ['north', 'west', 'metro', 'south'];

const zoneTone: Record<TerritoryId, { label: string; color: string; grid: string }> = {
  north: { label: 'North', color: '#2a74c2', grid: 'col-span-6 row-span-2' },
  west: { label: 'West', color: '#f09323', grid: 'col-span-2 row-span-3' },
  metro: { label: 'Metro', color: '#de2d3d', grid: 'col-span-4 row-span-2' },
  south: { label: 'South', color: '#6ea53a', grid: 'col-span-4 row-span-1' },
};

type ZoneMetric = {
  id: TerritoryId;
  name: string;
  accounts: number;
  untouched: number;
  activeOpps: number;
  nearClose: number;
  stuck: number;
  pipeline: number;
  closed: number;
  laneActive: Record<RevenueLane, number>;
};

function percent(value: number, total: number) {
  return Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
}

function ZoneButton({ zone, active, onSelect }: { zone: ZoneMetric; active: boolean; onSelect: () => void }) {
  const tone = zoneTone[zone.id];
  const coverage = percent(zone.accounts - zone.untouched, zone.accounts);
  return (
    <button
      aria-pressed={active}
      className={`${tone.grid} relative overflow-hidden rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? 'border-cyan-200 ring-2 ring-cyan-300/80' : 'border-white/20'}`}
      onClick={onSelect}
      style={{ background: `linear-gradient(135deg, ${tone.color}ee, ${tone.color}55)` }}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">TUF {tone.label}</p>
          <p className="mt-1 text-2xl font-black text-white md:text-4xl">{zone.accounts}</p>
          <p className="text-xs font-semibold text-white/80">schools covered</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white">
          <span>{zone.nearClose} near close</span>
          <span>{coverage}% touched</span>
          <span>{zone.untouched} untouched</span>
          <span>{formatCurrency(zone.pipeline)}</span>
        </div>
      </div>
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function TerritoryCommandMap({ title = 'TERRITORY COMMAND MAP', fullMapLink = true }: { title?: string; fullMapLink?: boolean }) {
  const territories = useTerritories();
  const organizations = useOrganizations({});
  const opportunities = useOpportunities({});
  const [activeZone, setActiveZone] = useState<TerritoryId>('metro');

  const zoneMetrics = useMemo<ZoneMetric[]>(() => {
    return territories.map((territory) => {
      const orgs = organizations.filter((org) => org.territory === territory.id);
      const orgIds = new Set(orgs.map((org) => org.id));
      const opps = opportunities.filter((opp) => orgIds.has(opp.organizationId));
      const laneActive = laneOrder.reduce((rows, lane) => {
        rows[lane] = orgs.filter((org) => ['ACTIVE', 'WON'].includes(org.laneStatuses[lane].status)).length;
        return rows;
      }, {} as Record<RevenueLane, number>);

      return {
        id: territory.id,
        name: territory.name,
        accounts: Math.max(territory.accounts, orgs.length),
        untouched: Math.max(territory.untouched, orgs.filter((org) => org.coverageStatus === 'UNTOUCHED').length),
        activeOpps: opps.filter((opp) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage)).length,
        nearClose: opps.filter((opp) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(opp.stage)).length,
        stuck: opps.filter((opp) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(opp.stage)).length,
        pipeline: Math.max(territory.pipeline, opps.reduce((sum, opp) => sum + opp.value, 0)),
        closed: Math.max(territory.closed, opps.filter((opp) => opp.stage === 'CLOSED_WON').reduce((sum, opp) => sum + opp.value, 0)),
        laneActive,
      };
    });
  }, [territories, organizations, opportunities]);

  const orderedZones = zoneOrder.map((id) => zoneMetrics.find((zone) => zone.id === id)).filter(Boolean) as ZoneMetric[];
  const active = zoneMetrics.find((zone) => zone.id === activeZone) ?? zoneMetrics[0];

  return (
    <GlassCard title={title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold text-slate-200">Metro, North, West, South only. No East zone.</p>
        {fullMapLink ? <Link className="text-cyan-300 hover:text-cyan-100" to="/territory/map">Open focus view</Link> : null}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.7fr)]">
        <div className="rounded-xl border border-slate-800 bg-[#07101a] p-3">
          <div className="grid min-h-[420px] grid-cols-6 grid-rows-5 gap-2">
            {orderedZones.map((zone) => (
              <ZoneButton key={zone.id} zone={zone} active={active?.id === zone.id} onSelect={() => setActiveZone(zone.id)} />
            ))}
          </div>
        </div>

        {active ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Zone</p>
                <h3 className="text-xl font-semibold text-white">{active.name}</h3>
              </div>
              <span className="rounded-full border px-2 py-1 text-xs font-semibold text-white" style={{ borderColor: zoneTone[active.id].color, color: zoneTone[active.id].color }}>
                {percent(active.accounts - active.untouched, active.accounts)}% touched
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat label="Schools" value={String(active.accounts)} />
              <MiniStat label="Untouched" value={String(active.untouched)} />
              <MiniStat label="Pipeline" value={formatCurrency(active.pipeline)} />
              <MiniStat label="Closed" value={formatCurrency(active.closed)} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Near-close deals</span>
                <span className="font-semibold text-cyan-200">{active.nearClose}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Stuck deals</span>
                <span className="font-semibold text-amber-200">{active.stuck}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Active opportunities</span>
                <span className="font-semibold text-emerald-200">{active.activeOpps}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lane Penetration</p>
              {laneOrder.map((lane) => (
                <div key={lane} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{getLaneLabel(lane)}</span>
                    <span className="text-slate-100">{active.laneActive[lane]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${percent(active.laneActive[lane], active.accounts)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {orderedZones.map((zone) => (
          <button key={zone.id} onClick={() => setActiveZone(zone.id)} className={`rounded-lg border p-3 text-left transition ${active?.id === zone.id ? 'border-cyan-300 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
            <p className="text-sm font-semibold" style={{ color: zoneTone[zone.id].color }}>{zone.name}</p>
            <p className="text-xs text-slate-400">{zone.nearClose} near close · {zone.untouched} untouched</p>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
