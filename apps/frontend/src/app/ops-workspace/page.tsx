'use client'

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/v1';

export default function OpsWorkspacePage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    // MVP queue: parser rows waiting on operator action.
    fetch(`${API_BASE_URL}/parsing/uploads/1/status`).then((r) => r.json()).then((data) => setRows(data?.rowStatusCounts || [])).catch(() => setRows([]));
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Ops Workspace</h1>
      <p className="mb-4">Queue states: NEEDS_REVIEW / READY_FOR_VENDOR / IN_PRODUCTION</p>
      {rows.map((row, idx) => (
        <div key={idx} className="border rounded p-3 mb-2">
          <strong>{row.validation_status}</strong>: {row.count}
        </div>
      ))}
      {rows.length === 0 && <p>No parser queue rows yet.</p>}
    </div>
  );
}
