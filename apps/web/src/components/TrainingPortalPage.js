import React from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import TufAcademyLogo from '../assets/tuf-academy.png';
export default function TrainingPortalPage() {
    const user = getStoredUser();
    const userId = user ? user.id : 'u-rep-jason-mulder';
    const isAdminOrDirector = user && (user.role === 'ADMIN' || user.role === 'DIRECTOR' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'OPERATIONS');
    const isCertified = user?.isCertified === true;
    const hrDocsDone = user?.hrDocsCompleted === true;
    const practicalDone = user?.practicalExerciseCompleted === true;
    const directorDone = user?.directorSignedOff === true;
    const certificationLabel = isCertified
        ? 'CRM Access: CERTIFIED ✓'
        : 'CRM Access: GATED — Complete Academy to Unlock';
    const gateStatuses = user?.role === 'REP'
        ? [
            { label: 'HR Docs', done: hrDocsDone },
            { label: 'Practical Exercise', done: practicalDone },
            { label: 'Director Signoff', done: directorDone },
        ]
        : [];
    return (<div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(31,182,255,0.22),transparent_38%),linear-gradient(135deg,rgba(7,12,19,0.98),rgba(3,7,12,0.94))] p-5 shadow-2xl shadow-cyan-950/30 md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"/>
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="mx-auto max-w-3xl">
              <img src={TufAcademyLogo} alt="TUF Academy" className="mx-auto h-14 w-auto object-contain drop-shadow-[0_0_22px_rgba(31,182,255,0.25)] sm:h-16"/>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Sales Enablement • CRM Sandbox • Operational Resources</p>
              <h1 className="mt-3 text-2xl font-black leading-tight text-white md:text-4xl">TUF Ops Onboarding & Resource Hub</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Access CRM training tools, sales playbooks, operations checklists, and territory launch manuals to accelerate your sales pipeline.</p>
              <div className="mt-3 space-y-1.5">
                <p className={`text-xs font-bold uppercase tracking-wider ${isCertified ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {certificationLabel}
                </p>
                {gateStatuses.length > 0 && (<div className="flex flex-wrap items-center justify-center gap-2">
                    {gateStatuses.map((gate) => (<span key={gate.label} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${gate.done
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400'}`}>
                        {gate.done ? '✓' : '○'} {gate.label}
                      </span>))}
                  </div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Tour Guide Card */}
        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-8xl">🧭</span>
          </div>
          <div className="max-w-2xl">
            <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-bold text-cyan-300 uppercase tracking-wider">Interactive Onboarding</span>
            <h2 className="mt-3 text-xl font-black text-white">CRM Pipeline Action Guide</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              We have launched a live, step-by-step CRM Sandbox tour. It is designed to take you through creating accounts, identifying opportunity lanes, navigating the Minnesota territory list, requesting mockup designs, and submitting final orders.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/organizations" className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                Start CRM Pipeline Action Guide
              </Link>
              <button onClick={() => {
            localStorage.setItem('tuf_combine_sandbox_active', 'true');
            alert('CRM Pipeline Action Guide has been reset. Navigate to the Organizations page to begin.');
        }} className="rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all">
                Reset Walkthrough State
              </button>
            </div>
          </div>
        </div>

        {/* PDF Training Resources Hub */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Document List */}
          <div className="rounded-2xl border border-slate-800 bg-[#070c13]/50 p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>📚</span> Playbooks & Launch Packets
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download the official PDF training materials covering standard operations, fabrics, discount thresholds, and local fulfillment logistics.
            </p>

            <div className="space-y-3 pt-2">
              {/* Doc item 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Territory Account Executive Launch Packet</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">PDF · 2.4 MB · Updated June 2026</p>
                  </div>
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading Territory Account Executive Launch Packet...'); }} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider">Download</a>
              </div>

              {/* Doc item 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📕</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">TUF Sales Playbook & objection scripts</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">PDF · 4.8 MB · Updated June 2026</p>
                  </div>
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading TUF Sales Playbook...'); }} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider">Download</a>
              </div>

              {/* Doc item 3 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📘</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">TUF Ops Workflow & Order Fulfillment</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">PDF · 1.7 MB · Updated June 2026</p>
                  </div>
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading TUF Ops Workflow...'); }} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider">Download</a>
              </div>
            </div>
          </div>

          {/* PDF File Uploader (Chief of Staff / Admin view) */}
          <div className="rounded-2xl border border-slate-800 bg-[#070c13]/50 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                <span>📤</span> Training Document Portal
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {isAdminOrDirector
            ? 'As a State Director or Administrator, you can upload new operational memos, product catalog updates, or regional guidelines for the sales team.'
            : 'Submit request or contact your Director to upload new training playbooks, brochures, or templates.'}
              </p>

              {/* Drag and Drop Zone */}
              <div onClick={() => {
            if (isAdminOrDirector) {
                alert('Select file dialog opened. (Simulated)');
            }
            else {
                alert('Only State Directors and Admins can upload resources.');
            }
        }} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${isAdminOrDirector
            ? 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950/20'
            : 'border-slate-900 bg-slate-950/5 cursor-not-allowed opacity-50'}`}>
                <span className="text-3xl mb-2">📁</span>
                <p className="text-sm font-bold text-slate-300">Drag & drop training PDF here</p>
                <p className="text-xs text-slate-600 mt-1">or click to browse local files (Max size: 25MB)</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 font-semibold mt-4 text-center">
              SECURE ADMIN FILE TRANSPORT PORTAL · ALL UPLOADS CLOUD SCAN SAFE
            </p>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=TrainingPortalPage.js.map