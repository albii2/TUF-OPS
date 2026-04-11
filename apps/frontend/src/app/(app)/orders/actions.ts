
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function generateOrderNumber() {
    const prefix = 'TUF';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString().slice(2, 8);
    return `${prefix}-${year}${month}-${random}`;
}

export async function createOrder(opportunityId: number) {
    const order = await prisma.order.create({
        data: {
            orderNumber: generateOrderNumber(),
            opportunity: { connect: { id: opportunityId } },
        },
    });

    redirect(`/orders/${order.id}`);
}
