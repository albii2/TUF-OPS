import React, { useMemo, useState } from 'react';
import { getOrganizationIntel, type OrganizationIntel } from '../services/lighthouseEngine';

interface Props { organizationId: string; organizationName: string; }

export const LighthousePanel: React.FC<Props> = ({ organizationId, organizationName }) => {
  const [intel, setIntel] = useState(120);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    try { setIntel(getOrganizationIntel(organizationId) as any); } catch (e: any) { setError(e.message); }
  }, [organizationId]);

  if (error) return <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4 mt-4"><p className="text-slate-500 text-sm">{error}</p></div>;
  if (!intel) return <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4 mt-4"><p className="text-slate-500 text-sm">Loading intelligence...</p></div>;

  const urg = (u: string) => u === 'NOW' ? 'text-rose-400 bg-rose-400/10' : u === 'SOON' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10';

  return (
    <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg overflow-hidden mt-4">
      <div className="px-4 py-3 bg-[#111118] border-b border-[#1e293b] flex items-center gap-2">
        <span className="text-blue-400 text-sm font-mono tracking-wider">LIGHTHOUSE</span>
        <span className="text-slate-500 text-xs">Account Intelligence</span>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1"><span className="text-slate-400 text-xs font-mono tracking-wider">DEVELOPMENT SCORE</span><span className="text-slate-300 text-sm font-bold">{intel.territoryDevelopmentScore}/100</span></div>
          <div className="w-full bg-[#1e293b] rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{width:intel.territoryDevelopmentScore+'%'}} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
            <h4 className="text-slate-400 text-[10px] font-mono tracking-wider mb-2">SPORTS MAPPED</h4>
            {intel.sportsMapped.length>0?<div className="flex flex-wrap gap-1">{intel.sportsMapped.map((s: string)=><span key={s} className="text-[10px] bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded">{s}</span>)}</div>:<p className="text-slate-500 text-xs">None</p>}
          </div>
          <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
            <h4 className="text-slate-400 text-[10px] font-mono tracking-wider mb-2">LANES ACTIVE</h4>
            {intel.revenueLanesActivated.length>0?<div className="flex flex-wrap gap-1">{intel.revenueLanesActivated.map((l: string)=><span key={l} className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">{l}</span>)}</div>:<p className="text-slate-500 text-xs">None</p>}
          </div>
        </div>
        {intel.revenueLanesMissing.length>0&&<div><h4 className="text-rose-400/80 text-xs font-mono tracking-wider mb-1.5">MISSING LANES</h4><div className="flex flex-wrap gap-1">{intel.revenueLanesMissing.map((l: string)=><span key={l} className="text-[10px] bg-rose-400/10 text-rose-400 px-2 py-0.5 rounded">{l}</span>)}</div></div>}
        <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
          <h4 className="text-slate-400 text-[10px] font-mono tracking-wider mb-2">CONTACTS</h4>
          <div className="flex items-center gap-2"><span className="text-blue-400 text-xs">{intel.knownContacts} known</span><span className="text-rose-400 text-xs">{intel.missingContacts.length} missing</span></div>
        </div>
        {intel.buyingWindows.length>0&&<div><h4 className="text-slate-400 text-xs font-mono tracking-wider mb-2">BUYING WINDOWS</h4><div className="space-y-1.5">{intel.buyingWindows.slice(0,5).map((bw: any,i: number)=><div key={i} className="flex items-center justify-between bg-[#111118] border border-[#1e293b] rounded px-3 py-2"><div><span className="text-slate-300 text-xs">{bw.sport}</span><span className="text-slate-500 text-[10px] ml-2">{bw.season}</span></div><span className={"text-[10px] px-2 py-0.5 rounded font-medium "+urg(bw.urgency)}>{bw.urgency}</span></div>)}</div></div>}
        <div className="bg-[#111118] border border-amber-400/20 rounded p-3"><h4 className="text-amber-400/80 text-[10px] font-mono tracking-wider mb-1">NEXT ACTION</h4><p className="text-slate-300 text-xs">{intel.nextActionRecommendation}</p></div>
      </div>
    </div>
  );
};
