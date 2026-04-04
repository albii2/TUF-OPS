import { prisma } from "@/lib/prisma";

export async function getOrderById(orderId: string) {
    const order = await prisma.uniformOrder.findUnique({
        where: { id: orderId },
        include: {
            opportunity: {
                include: {
                    program: true,
                    owner: true,
                    mockupRequests: true,
                    sampleRequests: true,
                    invoices: true,
                }
            },
            roster: true,
        }
    });

    return order;
}

export async function getOrders() {
    const orders = await prisma.uniformOrder.findMany({
        include: {
            opportunity: {
                include: {
                    program: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });
    return orders;
}
