'use client'

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/v1';

interface Order {
  id: number;
  opportunity_id: number;
  status: string;
  deal_type: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const orgs = await fetch(`${API_BASE_URL}/organizations`).then((r) => r.json());
      const opportunities = (await Promise.all(orgs.map((org: any) => fetch(`${API_BASE_URL}/opportunities/organization/${org.id}`).then((r) => r.json())))).flat();
      const closedWon = opportunities.filter((o: any) => o.stage === 'CLOSED_WON');
      const loaded = await Promise.all(closedWon.map(async (o: any) => {
        const res = await fetch(`${API_BASE_URL}/orders/opportunity/${o.id}`);
        if (res.ok) return res.json();
        return null;
      }));
      setOrders(loaded.filter(Boolean));
    }
    load().catch(console.error);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      {orders.map((order) => (
        <div key={order.id} className="border rounded p-3 mb-3">
          <p>Order #{order.id}</p>
          <p>Opportunity #{order.opportunity_id}</p>
          <p>Status: {order.status}</p>
          <p>Lane: {order.deal_type}</p>
        </div>
      ))}
      {orders.length === 0 && <p>No orders yet. Close opportunities to won to generate orders.</p>}
    </div>
  );
}
