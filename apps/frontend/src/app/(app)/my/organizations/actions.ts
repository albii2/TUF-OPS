'use server'

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getMyOrganizations() {
    const session = await requireSession();
    // @ts-ignore
    const userId = parseInt(session.user.id, 10);

    return await prisma.organization.findMany({ 
        where: { ownerId: userId },
        include: { owner: true } 
    });
}
