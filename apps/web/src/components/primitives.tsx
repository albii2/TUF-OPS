import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import type { LaneStatus, OpportunityStage, RevenueLane } from '../data/mockSalesData';

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur ${className}`}>
      {title ? <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{title}</h3> : null}
      {children}
    </section>
  );
}

export function Button({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200 hover:bg-cyan-500/25 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-10 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none ${props.className ?? ''}`} />;
}

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({ columns, rows, onRowClick, getRowId }: { columns: Column<T>[]; rows: T[]; onRowClick?: (row: T) => void; getRowId: (row: T) => string }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-950/70 text-[11px] tracking-[0.06em] text-slate-300">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-2 ${column.className ?? ''}`}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              className={`border-t border-slate-800 text-slate-200 ${onRowClick ? 'cursor-pointer hover:bg-slate-800/45' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-3 py-2 align-top ${column.className ?? ''}`}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <Button className="px-2 py-1" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
      <span className="text-slate-400">Page {page} of {totalPages}</span>
      <Button className="px-2 py-1" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  );
}

export function LaneBadge({ lane }: { lane: RevenueLane }) {
  return <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-cyan-200">{lane.replace('_', ' ')}</span>;
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return <span className="rounded-md border border-slate-600 bg-slate-800/70 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-slate-200">{stage.split('_').join(' ')}</span>;
}

export function LaneStatusBadge({ status }: { status: LaneStatus }) {
  const tone = status === 'WON' ? 'text-cyan-200 border-cyan-400/60' : status === 'ACTIVE' ? 'text-sky-200 border-sky-400/60' : status === 'LOST' ? 'text-slate-400 border-slate-600' : 'text-slate-300 border-slate-500';
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold tracking-[0.08em] ${tone}`}>{status}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-sm text-slate-400"><p className="font-medium text-slate-200">{title}</p><p className="mt-1">{description}</p></div>;
}

export function LoadingState() {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Loading…</div>;
}
