import { useMemo, useState } from 'react';
import { Card } from '../components/primitives';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useTerritories } from '../hooks/useTerritory';
import type { TerritoryId } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const zoneColor: Record<TerritoryId, string> = {
  north: '#1E4D8A',
  west: '#C7791F',
  metro: '#B91C1C',
  south: '#4B6D20',
};

export function TerritoryMapPage() {
  const territories = useTerritories();
  const organizations = useOrganizations({});
  const opportunities = useOpportunities({});
  const [activeZone, setActiveZone] = useState<TerritoryId>('metro');

  const zoneMetrics = useMemo(() => {
    return territories.map((zone) => {
      const orgs = organizations.filter((o) => o.territory === zone.id);
      const orgIds = new Set(orgs.map((o) => o.id));
      const opps = opportunities.filter((o) => orgIds.has(o.organizationId));
      return {
        ...zone,
        untouched: orgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length,
        pipeline: opps.reduce((s, o) => s + o.value, 0),
        closed: opps.filter((o) => o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0),
      };
    });
  }, [territories, organizations, opportunities]);

  const active = zoneMetrics.find((z) => z.id === activeZone);

  return (
    <div className="space-y-3">
      <Card title="TUF MINNESOTA TERRITORY MAP">
        <p className="mb-2 text-sm text-[var(--text-secondary)]">4 Zones · 296+ Schools · 1 Mission</p>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg panel-elevated p-2">
            <svg viewBox="0 0 800 620" className="w-full h-auto">
              <rect x="0" y="0" width="800" height="620" fill="#0a1118" />
              <polygon points="70,60 510,70 690,180 450,250 230,230 70,220" fill={activeZone === 'north' ? '#2f6cb3' : zoneColor.north} stroke="#d2d8de" strokeWidth="2" onClick={() => setActiveZone('north')} style={{ cursor: 'pointer' }} />
              <polygon points="70,220 230,230 230,540 70,540" fill={activeZone === 'west' ? '#dc8b2b' : zoneColor.west} stroke="#d2d8de" strokeWidth="2" onClick={() => setActiveZone('west')} style={{ cursor: 'pointer' }} />
              <polygon points="230,250 450,250 450,420 230,420" fill={activeZone === 'metro' ? '#dc2626' : zoneColor.metro} stroke="#d2d8de" strokeWidth="2" onClick={() => setActiveZone('metro')} style={{ cursor: 'pointer' }} />
              <polygon points="230,420 710,420 740,540 230,540" fill={activeZone === 'south' ? '#6f8f33' : zoneColor.south} stroke="#d2d8de" strokeWidth="2" onClick={() => setActiveZone('south')} style={{ cursor: 'pointer' }} />
              <text x="300" y="150" fill="#eaf2fb" fontSize="44" fontWeight="700">TUF NORTH</text>
              <text x="110" y="360" fill="#fef5ea" fontSize="44" fontWeight="700">TUF WEST</text>
              <text x="275" y="345" fill="#ffe8e8" fontSize="44" fontWeight="700">TUF METRO</text>
              <text x="285" y="500" fill="#eef8e2" fontSize="44" fontWeight="700">TUF SOUTH</text>
            </svg>
          </div>

          <Card title={active ? `${active.name.toUpperCase()} SNAPSHOT` : 'ZONE SNAPSHOT'}>
            {active ? (
              <div className="space-y-1 text-sm text-[var(--text-primary)]">
                <p>Total Schools: {active.accounts}</p>
                <p>Untouched: {active.untouched}</p>
                <p>Pipeline Value: {formatCurrency(active.pipeline)}</p>
                <p>Closed Revenue: {formatCurrency(active.closed)}</p>
                <p>Lane Penetration: U {active.lanePenetration.uniform}% · TS {active.lanePenetration.teamStore}% · TG {active.lanePenetration.travelGear}% · L {active.lanePenetration.letterman}%</p>
              </div>
            ) : null}
          </Card>
        </div>
      </Card>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {zoneMetrics.map((zone) => (
          <button key={zone.id} onClick={() => setActiveZone(zone.id)} className={`rounded-lg border p-3 text-left ${activeZone === zone.id ? 'border-[#1FB6FF] glow-blue' : 'border-[var(--border)] panel-elevated'}`}>
            <p className="font-semibold" style={{ color: zoneColor[zone.id] }}>{zone.name.toUpperCase()}</p>
            <p className="text-sm text-[var(--text-secondary)]">Total Schools ≈ {zone.accounts}</p>
            <p className="text-sm text-[var(--text-secondary)]">Untouched {zone.untouched}</p>
            <p className="text-sm text-[var(--text-secondary)]">Pipeline {formatCurrency(zone.pipeline)}</p>
            <p className="text-sm text-[var(--text-secondary)]">Closed {formatCurrency(zone.closed)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
