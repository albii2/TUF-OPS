'use server'

import { requireRole, requireSession } from "@/lib/auth/session";
import { getVisibleOpportunities } from "@/lib/auth/visibility";

export async function getOpportunities() {
    const session = await requireSession();
    // The getVisibleOpportunities function handles all role-based logic

    return await getVisibleOpportunities(session.user);
}

export async function getTeamOpportunities() {
    const session = await requireRole(["director"]);

    return await getVisibleOpportunities(session.user, {
        includeUnassignedForDirector: true,
    });
}
