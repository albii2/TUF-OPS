import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getAssignableUsers() {
  const session = await requireSession();
  const actorId = parseInt(session.user.id, 10);

  if (Number.isNaN(actorId)) {
    throw new Error("Invalid session user id.");
  }

  if (session.user.role === "rep") {
    return [];
  }

  if (session.user.role === "director") {
    return prisma.user.findMany({
      where: {
        OR: [{ id: actorId }, { managerId: actorId }],
      },
      orderBy: [{ name: "asc" }],
    });
  }

  return prisma.user.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
    },
  });
}
