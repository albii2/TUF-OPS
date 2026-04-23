'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: number;
  amount: number;
  status: string;
  due_date: string;
  payment_link: string;
  opportunity: {
    id: number;
    name: string;
  };
}

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    async function fetchInvoice() {
      if (!id) return;
      try {
        // NOTE: The API route for fetching a single invoice doesn't exist yet.
        // This is a placeholder for where that logic would go.
        // For now, we'll simulate a fetch.
        // const response = await fetch(`/api/invoices/${id}`);
        // if (response.ok) {
        //   const data = await response.json();
        //   setInvoice(data);
        // }
        setInvoice({
          id: 1,
          amount: 1250.00,
          status: 'Draft',
          due_date: '2024-12-01T00:00:00.000Z',
          payment_link: 'https://paypal.me/tuf/1250',
          opportunity: {
            id: 1,
            name: 'Varsity Football Uniforms'
          }
        });
      } catch (error) {
        console.error('Failed to fetch invoice', error);
      }
      setLoading(false);
    }
    fetchInvoice();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!invoice) {
    return <p>Invoice not found</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Invoice</h1>
          <div className={`px-3 py-1 rounded-full text-white ${invoice.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}`}>
            {invoice.status}
          </div>
          <a href={`/api/invoices/${invoice.id}/pdf`} download>
            <Button variant="outline">Download PDF</Button>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Billed To</h2>
            <p>-- Client Name --</p>
            <p>-- Client Address --</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Invoice #:</span> {String(invoice.id).padStart(5, '0')}</p>
            <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
            <p><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Opportunity</h2>
          <p>{invoice.opportunity.name}</p>
        </div>

        <div className="mt-8">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Custom Uniform Order</td>
                <td className="text-right p-2">${invoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-right mt-8">
          <p className="text-2xl font-bold">Total: ${invoice.amount.toFixed(2)}</p>
        </div>

        {invoice.payment_link && (
          <div className="text-center mt-8">
            <a href={invoice.payment_link} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Pay Now via PayPal</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
