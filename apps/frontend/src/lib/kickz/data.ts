import { notFound } from 'next/navigation'
import { OrderStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

async function markOverdueOrders(where: { dropId?: number; publicOrderId?: string }) {
  const now = new Date()
  await prisma.order.updateMany({
    where: {
      ...where,
      status: 'deposit_paid',
      balanceOwed: { gt: 0 },
      balanceDueAt: { lt: now },
    },
    data: {
      status: 'overdue',
    },
  })
}

export async function getDropBySlug(slug: string) {
  const existingDrop = await prisma.drop.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!existingDrop) notFound()

  await markOverdueOrders({ dropId: existingDrop.id })

  const drop = await prisma.drop.findUnique({
    where: { slug },
    include: {
      sizes: { orderBy: { sizeLabel: 'asc' } },
      orders: true,
    },
  })
  if (!drop) notFound()

  return drop
}

export async function getDropControlPanel(dropId: number) {
  await markOverdueOrders({ dropId })

  const drop = await prisma.drop.findUnique({
    where: { id: dropId },
    include: {
      sizes: { orderBy: { sizeLabel: 'asc' } },
      orders: {
        include: {
          customer: true,
          payments: {
            where: { status: 'succeeded' },
          },
        },
        orderBy: { created_at: 'desc' },
      },
    },
  })

  if (!drop) notFound()

  return drop
}

export async function getOrderByPublicId(publicOrderId: string) {
  await markOverdueOrders({ publicOrderId })

  const order = await prisma.order.findUnique({
    where: { publicOrderId },
    include: {
      customer: true,
      drop: true,
      payments: { orderBy: { created_at: 'asc' } },
    },
  })

  if (!order) notFound()

  return order
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['deposit_paid', 'overdue', 'paid_in_full']
