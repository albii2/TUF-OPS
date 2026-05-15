import type { PropsWithChildren } from 'react';
import TufLogoSvg from '../../public/tuf-logo.svg';

export function TufLogo({ compact = false }: { compact?: boolean }) {
  const className = compact ? 'inline-block h-12 w-40' : 'mx-auto inline-block h-20 w-full max-w-[280px]';
  return (
    <span className={className}>
      <img src={TufLogoSvg} alt="TUF Logo" />
    </span>
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
