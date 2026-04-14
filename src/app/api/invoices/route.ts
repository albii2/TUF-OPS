import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, amount, due_date, payment_link } = await request.json()

  // Get the latest invoice to determine the next invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: {
      invoice_number: 'desc',
    },
  });

  const nextInvoiceNumber = lastInvoice ? lastInvoice.invoice_number + 1 : 1001; // Start from 1001
  
  const newInvoice = await prisma.invoice.create({
    data: {
      invoice_number: nextInvoiceNumber,
      opportunity: { connect: { id: opportunity_id } },
      amount,
      due_date,
      payment_link,
      status: 'Draft'
    }
  })

  // Log activity
  if (session.user && (session.user as any).id) {
    await prisma.repActivity.create({
      data: {
        activity_type: 'Invoice Created',
        notes: `Invoice created for opportunity ID: ${opportunity_id}`,
        opportunity: { connect: { id: opportunity_id } },
        user: { connect: { id: (session.user as any).id } }
      }
    })
  }

  return NextResponse.json(newInvoice)
}