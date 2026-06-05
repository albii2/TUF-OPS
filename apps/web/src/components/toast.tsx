import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

type ToastKind = 'success' | 'error';
type ToastMessage = { id: number; kind: ToastKind; message: string; retryLabel?: string; onRetry?: () => void };

const ToastContext = createContext<{ success: (message: string) => void; error: (message: string, onRetry?: () => void) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);
  const remove = (id: number) => setItems((rows) => rows.filter((row) => row.id !== id));

  const api = useMemo(() => ({
    success: (message: string) => {
      const id = Date.now() + Math.random();
      setItems((rows) => [...rows, { id, kind: 'success', message }]);
      window.setTimeout(() => remove(id), 2600);
    },
    error: (message: string, onRetry?: () => void) => {
      const id = Date.now() + Math.random();
      setItems((rows) => [...rows, { id, kind: 'error', message, retryLabel: onRetry ? 'Retry' : undefined, onRetry }]);
    },
  }), []);

  return (
    <ToastContext.Provider value={api}>
      <>
        {children}
        <div className="fixed right-4 top-4 z-[90] space-y-2">
          {items.map((toast) => (
            <div key={toast.id} className={`min-w-[250px] max-w-[360px] rounded-lg border px-3 py-2 text-sm shadow-lg ${toast.kind === 'success' ? 'border-emerald-600 bg-emerald-950/95 text-emerald-100' : 'border-rose-700 bg-rose-950/95 text-rose-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <p>{toast.message}</p>
                <button className="text-xs underline" onClick={() => remove(toast.id)}>Dismiss</button>
              </div>
              {toast.retryLabel && toast.onRetry ? <button className="mt-2 text-xs underline" onClick={() => { toast.onRetry?.(); remove(toast.id); }}>{toast.retryLabel}</button> : null}
            </div>
          ))}
        </div>
      </>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
