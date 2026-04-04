import { prisma } from "@/lib/prisma";

export async function getLeads() {
  return prisma.lead.findMany({
    include: {
      assignedTo: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
