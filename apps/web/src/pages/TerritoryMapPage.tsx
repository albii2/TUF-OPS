import { useMemo, useState } from 'react';
import { Card } from '../components/primitives';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useTerritories } from '../hooks/useTerritory';
import type { TerritoryId } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const zoneColor: Record<TerritoryId, string> = {
  north: '#0F5AA6',
  west: '#DF7B05',
  metro: '#C8192A',
  south: '#5A8D2B',
};

const zoneActiveColor: Record<TerritoryId, string> = {
  north: '#2A74C2',
  west: '#F09323',
  metro: '#DE2D3D',
  south: '#6EA53A',
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
          <div className="rounded-lg panel-elevated bg-[#f6f7f9] p-2">
            <svg viewBox="0 0 960 1120" className="w-full h-auto">
              <path d="M40 60 L310 66 L315 24 L355 24 L362 66 L360 82 L366 98 L430 98 L452 107 L525 109 L548 116 L603 116 L613 123 L654 124 L670 131 L710 131 L735 146 L750 154 L786 152 L795 170 L845 183 L866 175 L893 190 L907 206 L870 230 L822 248 L785 288 L756 318 L733 357 L710 384 L687 413 L664 432 L641 462 L618 485 L590 516 L553 534 L515 552 L477 558 L445 553 L415 542 L377 529 L347 526 L324 515 L283 500 L250 490 L216 479 L173 459 L145 453 L113 432 L100 412 L73 382 L63 357 L60 331 L50 304 L44 278 L38 251 L32 228 L34 194 L43 167 L37 141 L46 113 Z" fill={activeZone === 'north' ? zoneActiveColor.north : zoneColor.north} stroke="#FFFFFF" strokeWidth="4" onClick={() => setActiveZone('north')} style={{ cursor: 'pointer' }} />
              <path d="M58 380 L113 380 L134 407 L180 444 L282 450 L300 470 L330 487 L363 496 L363 527 L386 527 L386 616 L363 631 L363 640 L373 652 L390 663 L402 680 L403 695 L387 707 L381 724 L389 742 L396 759 L393 777 L388 795 L388 930 L63 930 L63 730 L69 703 L82 687 L80 651 L70 630 L56 612 L39 599 L31 582 L42 562 L56 553 L63 536 L62 507 L53 490 L40 465 L37 443 L42 419 Z" fill={activeZone === 'west' ? zoneActiveColor.west : zoneColor.west} stroke="#FFFFFF" strokeWidth="4" onClick={() => setActiveZone('west')} style={{ cursor: 'pointer' }} />
              <path d="M368 498 L392 498 L398 487 L457 487 L475 506 L528 506 L546 498 L613 498 L624 508 L666 508 L680 496 L705 496 L714 485 L725 480 L735 486 L744 472 L771 471 L771 622 L745 639 L730 656 L723 688 L740 696 L743 710 L733 718 L724 736 L728 760 L723 773 L729 801 L724 823 L739 845 L722 854 L705 854 L687 869 L663 883 L634 883 L617 893 L599 885 L572 888 L547 885 L523 886 L497 876 L471 876 L447 861 L429 849 L422 830 L402 819 L398 801 L401 780 L387 770 L389 745 L383 724 L388 708 L401 693 L401 679 L391 665 L373 653 L363 640 L363 616 L387 603 L387 527 L368 527 Z" fill={activeZone === 'metro' ? zoneActiveColor.metro : zoneColor.metro} stroke="#FFFFFF" strokeWidth="4" onClick={() => setActiveZone('metro')} style={{ cursor: 'pointer' }} />
              <path d="M393 777 L403 800 L421 813 L423 831 L438 843 L454 859 L472 877 L495 876 L521 886 L599 884 L617 893 L635 883 L663 883 L688 868 L706 855 L723 855 L739 844 L754 846 L768 864 L790 870 L806 882 L826 900 L853 911 L870 924 L885 949 L897 972 L907 1001 L910 1038 L918 1057 L925 1076 L925 930 L722 930 L403 930 L392 930 Z" fill={activeZone === 'south' ? zoneActiveColor.south : zoneColor.south} stroke="#FFFFFF" strokeWidth="4" onClick={() => setActiveZone('south')} style={{ cursor: 'pointer' }} />
              <text x="290" y="250" fill="#FFFFFF" fontSize="56" fontWeight="800" textAnchor="middle">TUF NORTH</text>
              <text x="210" y="640" fill="#FFFFFF" fontSize="56" fontWeight="800" textAnchor="middle">TUF WEST</text>
              <text x="580" y="610" fill="#FFFFFF" fontSize="56" fontWeight="800" textAnchor="middle">TUF METRO</text>
              <text x="560" y="860" fill="#FFFFFF" fontSize="56" fontWeight="800" textAnchor="middle">TUF SOUTH</text>
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
