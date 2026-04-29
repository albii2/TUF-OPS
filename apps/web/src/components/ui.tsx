import type { PropsWithChildren } from 'react';

export function TufLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center gap-1.5 leading-none">
        <span className={`font-black uppercase tracking-[0.16em] text-slate-100 ${compact ? 'text-sm' : 'text-3xl'}`}>TUF</span>
        <span className={`font-black italic text-cyan-400 ${compact ? 'text-xs' : 'text-2xl'}`}>//</span>
        <span className={`font-black uppercase italic tracking-[0.08em] bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent ${compact ? 'text-sm' : 'text-3xl'}`}>OPS</span>
      </div>
      {!compact && <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">Command Center</p>}
    </div>
  );
}

export function GlassCard({ children, title, className = '' }: PropsWithChildren<{ title?: string; className?: string }>) {
  return (
    <section className={`rounded-xl border border-slate-800/95 bg-slate-950/75 p-3 shadow-[0_16px_40px_rgba(2,6,23,0.62)] backdrop-blur ${className}`}>
      {title ? <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-200">{title}</h3> : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-3">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-cyan-300">{value}</p>
    </GlassCard>
  );
}
