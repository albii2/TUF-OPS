import { useEffect, useState } from 'react';
import { Card } from '../components/primitives';
import { apiClient } from '../services/apiClient';
export function DataHealthPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const load = async () => {
            try {
                const payload = await apiClient('/health/data');
                setData(payload);
            }
            catch (e) {
                setError(e?.message || 'Unable to load data health.');
            }
        };
        load();
    }, []);
    return (<div className="space-y-3">
      <Card title="Data Health Command Center">
        {error ? <p className="text-rose-300">{error}</p> : null}
        {!data && !error ? <p className="text-slate-300">Loading data health…</p> : null}
        {data ? (<div className="space-y-2 text-sm text-slate-300">
            <p>Status: <span className="text-emerald-300">{data.status}</span></p>
            <p>API Timestamp: {data.timestamp}</p>
            <p>Backup Last Success: {data.backup_last_success_at ?? 'Not reported (set BACKUP_LAST_SUCCESS_AT env)'}</p>
            <p>Organizations: {data.counts.organizations}</p>
            <p>Opportunities: {data.counts.opportunities}</p>
            <p>Users: {data.counts.users}</p>
          </div>) : null}
      </Card>
    </div>);
}
//# sourceMappingURL=DataHealthPage.js.map