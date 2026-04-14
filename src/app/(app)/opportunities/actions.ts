'use server'

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { getVisibleOpportunities } from "@/lib/auth/visibility";

export async function getOpportunities() {
    const session = await requireSession();
    // The getVisibleOpportunities function handles all role-based logic

    return await getVisibleOpportunities(session.user);
}
