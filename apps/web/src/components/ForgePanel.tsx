import React, { useMemo, useState } from 'react';
import { getForgeMission, type ForgeMission } from '../services/forgeEngine';

export const ForgePanel: React.FC = () => {
  const [mission, setMission] = useState<ForgeMission | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useMemo(() => {
    try {
      setMission(getForgeMission());
    } catch {
      setMission(null);
    }
  }, []);

  if (!mission || mission.topAccounts.length === 0) {
    return (
      <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4">
        <p className="text-slate-400 text-sm">No pipeline data available. Create your first opportunity to enable Forge intelligence.</p>
      </div>
    );
  }

  const priorityColor = (p: number) => {
    switch (p) {
      case 1: return 'text-rose-400';
      case 2: return 'text-amber-400';
      case 3: return 'text-blue-400';
      case 4: return 'text-slate-400';
      default: return 'text-slate-500';
    }
  };

  const priorityBg = (p: number) => {
    switch (p) {
      case 1: return 'bg-rose-400/10 border-rose-400/30';
      case 2: return 'bg-amber-400/10 border-amber-400/30';
      case 3: return 'bg-blue-400/10 border-blue-400/30';
      case 4: return 'bg-slate-400/10 border-slate-400/30';
      default: return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#111118] border-b border-[#1e293b] cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm font-mono tracking-wider">⚒ FORGE</span>
          <span className="text-slate-500 text-xs">Pipeline Intelligence</span>
        </div>
        <span className="text-slate-500 text-xs">{collapsed ? '▸' : '▾'}</span>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Daily Briefing */}
          <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
            <p className="text-slate-300 text-sm font-medium">{mission.repName} — {mission.territory}</p>
            <p className="text-slate-400 text-xs mt-1">{mission.dailyBriefing}</p>
          </div>

          {/* Top Priority Accounts */}
          <div>
            <h4 className="text-slate-400 text-xs font-mono tracking-wider mb-2">MISSION PRIORITIES</h4>
            <div className="space-y-2">
              {mission.topAccounts.map((acct, i) => (
                <div key={acct.organizationId} className={`border rounded p-3 ${priorityBg(acct.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-sm font-semibold ${priorityColor(acct.priority)}`}>
                        {acct.organizationName}
                      </span>
                      {acct.opportunityStage && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                          {acct.opportunityStage.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${priorityColor(acct.priority)}`}>P{acct.priority}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{acct.reason}</p>
                  <p className="text-amber-400/80 text-xs mt-0.5 font-medium">{acct.recommendedAction}</p>
                  {acct.daysSinceContact && acct.daysSinceContact > 7 && (
                    <p className="text-rose-400/60 text-[10px] mt-1">{acct.daysSinceContact} days since last contact</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Gaps */}
          {mission.pipelineGaps.length > 0 && (
            <div>
              <h4 className="text-rose-400/80 text-xs font-mono tracking-wider mb-1.5">GAPS</h4>
              <ul className="space-y-1">
                {mission.pipelineGaps.map((g, i) => (
                  <li key={i} className="text-slate-400 text-xs">• {g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* At-Risk */}
          {mission.atRiskOpportunities.length > 0 && (
            <div>
              <h4 className="text-amber-400/80 text-xs font-mono tracking-wider mb-1.5">AT RISK</h4>
              <div className="space-y-1.5">
                {mission.atRiskOpportunities.map((acct) => (
                  <div key={acct.organizationId} className="bg-amber-400/5 border border-amber-400/20 rounded p-2">
                    <p className="text-amber-400 text-xs font-medium">{acct.organizationName}</p>
                    <p className="text-slate-500 text-[10px]">{acct.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Best Lane + Academy */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
              <h4 className="text-slate-400 text-[10px] font-mono tracking-wider mb-1">NEXT BEST LANE</h4>
              <p className="text-slate-300 text-xs">{mission.nextBestLane}</p>
            </div>
            <div className="bg-[#111118] border border-[#1e293b] rounded p-3">
              <h4 className="text-slate-400 text-[10px] font-mono tracking-wider mb-1">ACADEMY</h4>
              <p className="text-amber-400/80 text-xs">{mission.academyTip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
