'use server'

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getMyOrganizations() {
    const session = await requireSession();

    const userId = session.user.id;

    return await prisma.organization.findMany({ 
        where: { ownerId: userId },
        include: { owner: true } 
    });
}
