'use client'

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StageProgress } from '@/components/stage-progress';
import { API_BASE_URL, OPPORTUNITY_STAGES } from '@/lib/v1';

interface Opportunity {
  id: number;
  name: string;
  stage: string;
  organization_id: number;
  channel_type: string;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunity() {      const response = await fetch(`${API_BASE_URL}/opportunities/${id}`);
      if (!response.ok) {
        setError('Opportunity not found');
        return;
      }
      const match = await response.json();
      setOpportunity(match);
    }

    if (id) fetchOpportunity().catch((e) => setError(String(e)));
  }, [id]);

  const nextStage = useMemo(() => {
    if (!opportunity) return null;
    const idx = OPPORTUNITY_STAGES.indexOf(opportunity.stage as any);
    return idx >= 0 && idx < OPPORTUNITY_STAGES.length - 1 ? OPPORTUNITY_STAGES[idx + 1] : null;
  }, [opportunity]);

  async function transition(targetStage: string) {
    if (!opportunity) return;
    setError(null);
    setMessage(null);
    const payload: any = { toStage: targetStage, changedBy: 1 };
    if (targetStage === 'CLOSED_WON') {
      payload.actual_revenue = 1000;
      payload.actual_cost = 700;
    }
    const res = await fetch(`${API_BASE_URL}/opportunities/${opportunity.id}/stage`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.message || 'Stage update failed');
      return;
    }

    const updated = await res.json();
    setOpportunity(updated);
    if (targetStage === 'CLOSED_WON') {
      const orderRes = await fetch(`${API_BASE_URL}/orders/from-opportunity/${opportunity.id}`, { method: 'POST' });
      if (orderRes.ok) {
        const order = await orderRes.json();
        setMessage(`Order #${order.id} ready from CLOSED_WON conversion.`);
      }
    }
  }

  if (error) return <p>{error}</p>;
  if (!opportunity) return <p>Loading...</p>;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">{opportunity.name}</h1>
      <p>Lane: {opportunity.channel_type}</p>
      <StageProgress currentStage={opportunity.stage} />
      <div className="flex gap-2">
        {nextStage && <Button onClick={() => transition(nextStage)}>Move to {nextStage}</Button>}
      </div>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
