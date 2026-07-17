import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './primitives';
import { getCoordsForZip } from '../data/mnZipCoords';
import csvRaw from '../assets/tuf_mn_leads_final.csv?raw';
// ── Constants ──────────────────────────────────────────
const ZONE_COLORS = {
    'TUF Metro': '#3B82F6',
    'TUF South': '#10B981',
    'TUF West': '#F59E0B',
    'TUF North': '#8B5CF6',
};
const ZONE_ORDER = ['TUF Metro', 'TUF South', 'TUF West', 'TUF North'];
const TIER_COLORS = {
    'Tier 1': '#FFD700', // gold
    'Tier 2': '#C0C0C0', // silver
    'Tier 3': '#CD7F32', // bronze
};
const TIER_ORDER = ['Tier 1', 'Tier 2', 'Tier 3'];
const MN_CENTER = [45.5, -94.0];
const DEFAULT_ZOOM = 7;
// ── SVG marker icons ───────────────────────────────────
function createMarkerIcon(color, tier) {
    const size = tier === 'Tier 1' ? 28 : tier === 'Tier 2' ? 22 : 18;
    const borderColor = tier ? TIER_COLORS[tier] : color;
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid ${borderColor};
      border-radius:50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}
// ── CSV Parser ─────────────────────────────────────────
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        }
        else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}
function loadSchoolsSync() {
    const text = csvRaw;
    const lines = text.trim().split('\n');
    const header = parseCSVLine(lines[0]);
    const colIdx = {
        school_name: header.indexOf('school_name'),
        tuf_zone: header.indexOf('tuf_zone'),
        tuf_priority: header.indexOf('tuf_priority'),
        assigned_rep_name: header.indexOf('assigned_rep_name'),
        football_offered: header.indexOf('football_offered'),
        basketball_offered: header.indexOf('basketball_offered'),
        hockey_offered: header.indexOf('hockey_offered'),
        baseball_offered: header.indexOf('baseball_offered'),
        address: header.indexOf('address'),
        parsed_zip: header.indexOf('parsed_zip'),
    };
    const schools = [];
    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        const zip = fields[colIdx.parsed_zip]?.trim() || '';
        if (!zip || zip.length !== 5)
            continue;
        const repName = fields[colIdx.assigned_rep_name]?.trim() || '';
        const displayRep = repName && repName !== 'Unassigned Rep Pool' ? repName : 'Unassigned';
        schools.push({
            school_name: fields[colIdx.school_name]?.trim() || 'Unknown',
            tuf_zone: fields[colIdx.tuf_zone]?.trim() || 'TUF Metro',
            tuf_priority: fields[colIdx.tuf_priority]?.trim() || 'Tier 3',
            zip,
            assigned_rep_name: displayRep,
            football_offered: fields[colIdx.football_offered]?.trim() || 'No',
            basketball_offered: fields[colIdx.basketball_offered]?.trim() || 'No',
            hockey_offered: fields[colIdx.hockey_offered]?.trim() || 'No',
            baseball_offered: fields[colIdx.baseball_offered]?.trim() || 'No',
            address: fields[colIdx.address]?.trim() || '',
        });
    }
    return schools;
}
// ── Components ─────────────────────────────────────────
/** Fly-to helper that runs inside the MapContainer context */
function FlyTo({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 0.8 });
    }, [center, zoom, map]);
    return null;
}
function SearchBox({ onSelect }) {
    const [query, setQuery] = useState('');
    const [schools, setSchools] = useState([]);
    const [allSchools, setAllSchools] = useState([]);
    useEffect(() => {
        setAllSchools(loadSchoolsSync());
    }, []);
    const filtered = useMemo(() => {
        if (!query.trim())
            return [];
        const q = query.toLowerCase();
        return allSchools.filter((s) => s.school_name.toLowerCase().includes(q)).slice(0, 8);
    }, [query, allSchools]);
    return (<div style={{ position: 'relative', width: '100%' }}>
      <input type="text" placeholder="Search schools..." value={query} onChange={(e) => setQuery(e.target.value)} style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
        }}/>
      {filtered.length > 0 && (<div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1001,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '0 0 6px 6px',
                maxHeight: 240,
                overflowY: 'auto',
            }}>
          {filtered.map((s, i) => (<div key={i} onClick={() => {
                    onSelect(s);
                    setQuery(s.school_name);
                    setSchools((prev) => [...prev, s]);
                }} style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderBottom: '1px solid var(--border)',
                }} onMouseEnter={(e) => {
                    e.target.style.background = 'var(--hover-bg, #f0f0f0)';
                }} onMouseLeave={(e) => {
                    e.target.style.background = '';
                }}>
              {s.school_name}
            </div>))}
        </div>)}
    </div>);
}
// ── Main Component ─────────────────────────────────────
export function TerritoryMapView() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [flyTo, setFlyTo] = useState({
        center: MN_CENTER,
        zoom: DEFAULT_ZOOM,
    });
    // Toggle filters
    const [zoneFilters, setZoneFilters] = useState(new Set(ZONE_ORDER));
    const [tierFilters, setTierFilters] = useState(new Set(TIER_ORDER));
    const [repFilters, setRepFilters] = useState(new Set(['all']));
    const [searchSelected, setSearchSelected] = useState(null);
    useEffect(() => {
        const data = loadSchoolsSync();
        setSchools(data);
        setLoading(false);
    }, []);
    // Derive unique reps
    const allReps = useMemo(() => {
        const reps = new Set();
        schools.forEach((s) => {
            if (s.assigned_rep_name && s.assigned_rep_name !== 'Unassigned') {
                reps.add(s.assigned_rep_name);
            }
        });
        return ['all', ...Array.from(reps).sort()];
    }, [schools]);
    // Filtered schools
    const filteredSchools = useMemo(() => {
        return schools.filter((s) => {
            const zone = s.tuf_zone;
            const tier = s.tuf_priority;
            if (!zoneFilters.has(zone))
                return false;
            if (!tierFilters.has(tier))
                return false;
            if (!repFilters.has('all') && !repFilters.has(s.assigned_rep_name))
                return false;
            return true;
        });
    }, [schools, zoneFilters, tierFilters, repFilters]);
    // Stats
    const zoneCounts = useMemo(() => {
        const counts = {};
        ZONE_ORDER.forEach((z) => (counts[z] = 0));
        schools.forEach((s) => {
            const z = s.tuf_zone;
            if (counts[z] !== undefined)
                counts[z]++;
        });
        return counts;
    }, [schools]);
    // Toggle helpers
    const toggleZone = useCallback((z) => {
        setZoneFilters((prev) => {
            const next = new Set(prev);
            if (next.has(z))
                next.delete(z);
            else
                next.add(z);
            return next;
        });
    }, []);
    const toggleTier = useCallback((t) => {
        setTierFilters((prev) => {
            const next = new Set(prev);
            if (next.has(t))
                next.delete(t);
            else
                next.add(t);
            return next;
        });
    }, []);
    const handleSearchSelect = useCallback((school) => {
        setSearchSelected(school);
        const coords = getCoordsForZip(school.zip);
        setFlyTo({ center: coords, zoom: 14 });
    }, []);
    if (loading) {
        return (<Card title="TUF MINNESOTA TERRITORY MAP">
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--text-secondary)]">Loading school data...</p>
        </div>
      </Card>);
    }
    return (<div className="space-y-3">
      <Card title="TUF MINNESOTA INTERACTIVE TERRITORY MAP">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          4 Zones · {schools.length} Schools · 1 Mission
        </p>

        {/* ─── Search ─── */}
        <div className="mb-3 max-w-md">
          <SearchBox onSelect={handleSearchSelect}/>
        </div>

        {/* ─── Map + Legend layout ─── */}
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          {/* Leaflet Map */}
          <div className="rounded-lg overflow-hidden border border-[var(--border)]" style={{ height: 560 }}>
            <MapContainer center={MN_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <FlyTo center={flyTo.center} zoom={flyTo.zoom}/>

              {/* Zone overlay circles for visual reference */}
              {ZONE_ORDER.map((zone) => {
            if (!zoneFilters.has(zone))
                return null;
            // Just a rough circle for each zone region
            const centers = {
                'TUF Metro': [44.97, -93.26],
                'TUF South': [44.05, -93.5],
                'TUF West': [45.55, -95.5],
                'TUF North': [47.2, -93.0],
            };
            const radii = {
                'TUF Metro': 65000,
                'TUF South': 180000,
                'TUF West': 200000,
                'TUF North': 250000,
            };
            return (<Circle key={zone} center={centers[zone]} radius={radii[zone]} pathOptions={{
                    color: ZONE_COLORS[zone],
                    fillColor: ZONE_COLORS[zone],
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: '8 6',
                }}/>);
        })}

              {/* School markers */}
              {filteredSchools.map((school, idx) => {
            const coords = getCoordsForZip(school.zip);
            const zone = school.tuf_zone;
            const tier = school.tuf_priority;
            const icon = createMarkerIcon(ZONE_COLORS[zone], tier);
            const isYes = (val) => val?.toLowerCase() === 'yes' ? '✓' : '—';
            return (<Marker key={`${school.school_name}-${idx}`} position={coords} icon={icon}>
                    <Popup maxWidth={320} className="school-popup">
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                        <strong style={{ fontSize: 14 }}>
                          {school.school_name}
                        </strong>
                        <br />
                        <span style={{ color: ZONE_COLORS[zone] }}>
                          ● {zone}
                        </span>{' '}
                        ·{' '}
                        <span style={{
                    color: TIER_COLORS[tier],
                    fontWeight: 600,
                }}>
                          {tier}
                        </span>
                        <br />
                        <strong>Rep:</strong> {school.assigned_rep_name}
                        <br />
                        <strong>Address:</strong> {school.address}
                        <br />
                        <strong>Sports:</strong>
                        <br />
                        <span style={{
                    display: 'inline-block',
                    marginRight: 10,
                    fontSize: 12,
                }}>
                          🏈 {isYes(school.football_offered)} Football
                        </span>
                        <span style={{
                    display: 'inline-block',
                    marginRight: 10,
                    fontSize: 12,
                }}>
                          🏀 {isYes(school.basketball_offered)} Basketball
                        </span>
                        <span style={{
                    display: 'inline-block',
                    marginRight: 10,
                    fontSize: 12,
                }}>
                          🏒 {isYes(school.hockey_offered)} Hockey
                        </span>
                        <span style={{
                    display: 'inline-block',
                    marginRight: 10,
                    fontSize: 12,
                }}>
                          ⚾ {isYes(school.baseball_offered)} Baseball
                        </span>
                      </div>
                    </Popup>
                  </Marker>);
        })}
            </MapContainer>
          </div>

          {/* ─── Legend & Filters Sidebar ─── */}
          <div className="space-y-3">
            {/* Zone Legend */}
            <div className="panel-elevated rounded-lg p-3">
              <p className="font-semibold text-sm mb-2">ZONES</p>
              {ZONE_ORDER.map((zone) => (<label key={zone} className="flex items-center gap-2 mb-1.5 cursor-pointer text-sm" style={{ opacity: zoneFilters.has(zone) ? 1 : 0.4 }}>
                  <input type="checkbox" checked={zoneFilters.has(zone)} onChange={() => toggleZone(zone)} className="cursor-pointer"/>
                  <span style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: ZONE_COLORS[zone],
            }}/>
                  <span>
                    {zone.replace('TUF ', '')}{' '}
                    <span className="text-[var(--text-secondary)] text-xs">
                      ({zoneCounts[zone] || 0})
                    </span>
                  </span>
                </label>))}
            </div>

            {/* Tier Legend */}
            <div className="panel-elevated rounded-lg p-3">
              <p className="font-semibold text-sm mb-2">TIERS</p>
              {TIER_ORDER.map((tier) => {
            const count = schools.filter((s) => s.tuf_priority === tier).length;
            return (<label key={tier} className="flex items-center gap-2 mb-1.5 cursor-pointer text-sm" style={{ opacity: tierFilters.has(tier) ? 1 : 0.4 }}>
                    <input type="checkbox" checked={tierFilters.has(tier)} onChange={() => toggleTier(tier)} className="cursor-pointer"/>
                    <span style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: TIER_COLORS[tier],
                    border: '2px solid #888',
                }}/>
                    <span>
                      {tier}{' '}
                      <span className="text-[var(--text-secondary)] text-xs">
                        ({count})
                      </span>
                    </span>
                  </label>);
        })}
            </div>

            {/* Rep Filters */}
            <div className="panel-elevated rounded-lg p-3">
              <p className="font-semibold text-sm mb-2">REPS</p>
              {allReps.map((rep) => (<label key={rep} className="flex items-center gap-2 mb-1 cursor-pointer text-sm" style={{
                opacity: rep === 'all'
                    ? repFilters.has('all') ? 1 : 0.4
                    : repFilters.has('all') || repFilters.has(rep) ? 1 : 0.4,
            }}>
                  <input type="checkbox" checked={rep === 'all'
                ? repFilters.has('all')
                : repFilters.has(rep)} onChange={() => {
                setRepFilters((prev) => {
                    const next = new Set(prev);
                    if (rep === 'all') {
                        if (next.has('all')) {
                            next.clear();
                        }
                        else {
                            next.clear();
                            next.add('all');
                        }
                    }
                    else {
                        next.delete('all');
                        if (next.has(rep))
                            next.delete(rep);
                        else
                            next.add(rep);
                        if (next.size === 0)
                            next.add('all');
                    }
                    return next;
                });
            }} className="cursor-pointer"/>
                  <span>
                    {rep === 'all' ? 'All Reps' : rep}{' '}
                    {rep !== 'all' && (<span className="text-[var(--text-secondary)] text-xs">
                        (
                        {schools.filter((s) => s.assigned_rep_name === rep)
                    .length}
                        )
                      </span>)}
                  </span>
                </label>))}
            </div>

            {/* Quick Stats */}
            <div className="panel-elevated rounded-lg p-3">
              <p className="font-semibold text-sm mb-2">MAP SUMMARY</p>
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <p>Showing: {filteredSchools.length} schools</p>
                <p>Total: {schools.length} schools</p>
                <p>Active Zones: {Array.from(zoneFilters).map((z) => z.replace('TUF ', '')).join(', ') || 'None'}</p>
                <p>Active Tiers: {Array.from(tierFilters).join(', ') || 'None'}</p>
                {searchSelected && (<p>
                    🔍 Selected: {searchSelected.school_name}
                  </p>)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone summary cards */}
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {ZONE_ORDER.map((zone) => {
            const zoneSchools = schools.filter((s) => s.tuf_zone === zone);
            const repSet = new Set(zoneSchools
                .map((s) => s.assigned_rep_name)
                .filter((r) => r && r !== 'Unassigned'));
            return (<button key={zone} onClick={() => {
                    setZoneFilters(new Set([zone]));
                    setTierFilters(new Set(TIER_ORDER));
                    setRepFilters(new Set(['all']));
                }} className={`rounded-lg border p-3 text-left transition-colors ${zoneFilters.has(zone) && zoneFilters.size === 1
                    ? 'border-[#1FB6FF] glow-blue'
                    : 'border-[var(--border)] panel-elevated'}`}>
              <p className="font-semibold text-sm" style={{ color: ZONE_COLORS[zone] }}>
                {zone.toUpperCase()}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Schools: {zoneSchools.length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Tier 1: {zoneSchools.filter((s) => s.tuf_priority === 'Tier 1').length}{' '}
                · Tier 2: {zoneSchools.filter((s) => s.tuf_priority === 'Tier 2').length}{' '}
                · Tier 3: {zoneSchools.filter((s) => s.tuf_priority === 'Tier 3').length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Reps: {repSet.size > 0 ? Array.from(repSet).join(', ') : '0 assigned'}
              </p>
            </button>);
        })}
      </div>
    </div>);
}
export default TerritoryMapView;
//# sourceMappingURL=TerritoryMap.js.map