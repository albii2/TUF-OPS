'use server'

import { prisma } from "@/lib/prisma";
import { getPayPalAccessToken } from "@/lib/paypal";
import { z } from "zod";

const CreateOrderSchema = z.object({
  invoiceId: z.string(),
});

export async function createPaypalOrder(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const accessToken = await getPayPalAccessToken();
  const url = `${process.env.PAYPAL_API_URL}/v2/checkout/orders`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: invoice.amount.toFixed(2),
          },
          invoice_id: invoice.id,
        },
      ],
    }),
  });

  const order = await response.json();
  return order.id;
}

export async function capturePaypalOrder(orderId: string) {
    const accessToken = await getPayPalAccessToken();
    const url = `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();

    if (data.status === 'COMPLETED') {
        const invoiceId = data.purchase_units[0].invoice_id;
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' },
        });
    }

    return data;
}
