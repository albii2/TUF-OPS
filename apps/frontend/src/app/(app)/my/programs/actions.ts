'use server'

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getMyPrograms() {
    const session = await requireSession();

    const userId = parseInt(session.user.id, 10);

    return await prisma.program.findMany({ 
        where: { ownerId: userId },
        include: { owner: true } 
    });
}
