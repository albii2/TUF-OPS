import { getLaneLabel } from '../utils/naming';
export function Card({ title, children, className = '' }) {
    return <section className={`panel rounded-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${className}`}>{title ? <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{title}</h3> : null}{children}</section>;
}
export function Button({ children, className = '', type = 'button', ...props }) {
    return <button type={type} className={`rounded-lg border border-[color:var(--blue-1)]/60 bg-[color:var(--glow)] px-3 py-2.5 min-h-10 text-sm font-semibold text-[#dff5ff] transition hover:bg-[#10324a] ${className}`} {...props}>{children}</button>;
}
export function Input(props) { return <input {...props} className={`h-10 rounded-lg panel-elevated px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] ${props.className ?? ''}`}/>; }
export function Select(props) { return <select {...props} className={`h-10 rounded-lg panel-elevated px-3 text-sm text-[var(--text-primary)] ${props.className ?? ''}`}/>; }
export function DataTable({ columns, rows, onRowClick, getRowId }) {
    return <div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="min-w-full text-left text-sm"><thead className="bg-[#0a121b] text-[12px] text-[var(--text-secondary)]"><tr>{columns.map((c) => <th key={c.key} className={`px-3 py-2.5 min-h-10 font-semibold whitespace-nowrap ${c.className ?? ''}`}>{c.header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={getRowId(row)} className={`border-t border-[var(--border)] text-[var(--text-primary)] ${onRowClick ? 'cursor-pointer hover:bg-[#0f1a27]' : ''}`} onClick={() => onRowClick?.(row)}>{columns.map((c) => <td key={c.key} className={`px-3 py-2.5 min-h-10 align-top whitespace-nowrap ${c.className ?? ''}`}>{c.cell(row)}</td>)}</tr>)}</tbody></table></div>;
}
export function Pagination({ page, totalPages, onPageChange }) { return <div className="mt-2 flex items-center justify-end gap-2 text-xs"><Button className="px-2 py-1" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</Button><span className="text-[var(--text-secondary)]">Page {page} of {totalPages}</span><Button className="px-2 py-1" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button></div>; }
export function LaneBadge({ lane, lanes }) {
    const badges = lanes ?? (lane ? [lane] : []);
    return <span className="inline-flex flex-wrap gap-1">{badges.map((l) => <span key={l} className="rounded-full border border-[#23557a] bg-[#0e2131] px-2 py-0.5 text-[10px] font-semibold text-[#cdeaff]">{getLaneLabel(l)}</span>)}</span>;
}
export function StageBadge({ stage }) { return <span className="rounded-full border border-[#2f6bb3] bg-[#113055] px-2 py-0.5 text-[10px] font-medium text-[#dbeeff]">{stage.split('_').join(' ')}</span>; }
export function LaneStatusBadge({ status }) { const tone = status === 'WON' ? 'text-emerald-300 border-emerald-500/50' : status === 'ACTIVE' ? 'text-sky-200 border-sky-500/50' : status === 'LOST' ? 'text-rose-200 border-rose-500/50' : 'text-slate-200 border-slate-500'; return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{status}</span>; }
export function EmptyState({ title, description }) { return <div className="rounded-xl border border-dashed border-slate-700 bg-[#0a121b] p-5 text-center text-sm text-[var(--text-secondary)]"><p className="font-medium text-[var(--text-primary)]">{title}</p><p className="mt-1">{description}</p></div>; }
export function LoadingState() { return <div className="rounded-xl border border-[var(--border)] bg-[#0a121b] p-4 text-sm text-[var(--text-secondary)]">Loading…</div>; }
export function SmallKpi({ label, value, note }) {
    return (<div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="text-xs text-slate-400">{note}</p>
        </div>);
}
//# sourceMappingURL=primitives.js.map