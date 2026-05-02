import type { PropsWithChildren } from 'react';

export function TufLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center gap-1.5 leading-none">
        <span className={`font-black uppercase tracking-[0.16em] text-[var(--text-primary)] ${compact ? 'text-sm' : 'text-3xl'}`}>TUF</span>
        <span className={`font-black italic text-[#1FB6FF] ${compact ? 'text-xs' : 'text-2xl'}`}>//</span>
        <span className={`font-black uppercase italic tracking-[0.08em] bg-gradient-to-r from-[#1FB6FF] to-[#3B82F6] bg-clip-text text-transparent ${compact ? 'text-sm' : 'text-3xl'}`}>OPS</span>
      </div>
      {!compact && <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Command Center</p>}
    </div>
  );
}

export function GlassCard({ children, title, className = '' }: PropsWithChildren<{ title?: string; className?: string }>) {
  return (
    <section className={`panel rounded-xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.44)] ${className}`}>
      {title ? <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-[var(--text-primary)]">{title}</h3> : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-3">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1FB6FF]">{value}</p>
    </GlassCard>
  );
}
