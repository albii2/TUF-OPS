import type { PropsWithChildren } from 'react';

export function TufLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="h-8 w-8 rounded-md border border-cyan-400/60 bg-gradient-to-br from-cyan-400/25 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.35)]" />
      <div>
        <p className={`font-semibold tracking-[0.18em] text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>TUF // OPS</p>
        {!compact && <p className="text-[10px] tracking-[0.12em] text-slate-400">Sales Command Center</p>}
      </div>
    </div>
  );
}

export function GlassCard({ children, title, className = '' }: PropsWithChildren<{ title?: string; className?: string }>) {
  return (
    <section className={`rounded-xl border border-slate-700/80 bg-slate-900/82 p-3 shadow-[0_12px_26px_rgba(2,6,23,0.55)] backdrop-blur ${className}`}>
      {title ? <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-slate-200">{title}</h3> : null}
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
