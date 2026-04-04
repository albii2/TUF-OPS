'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus),
});

export async function updateOrderStatus(input: unknown) {
  const session = await requireSession();
  if (session.user.role !== 'admin' && session.user.role !== 'director') {
    throw new Error("Unauthorized: You do not have permission to update the order status.");
  }
  
  const data = updateOrderStatusSchema.parse(input);

  const updatedOrder = await prisma.uniformOrder.update({
    where: {
      id: data.orderId,
    },
    data: {
      status: data.status,
    },
  });

  revalidatePath(`/orders/${data.orderId}`);
  
  return updatedOrder;
}
