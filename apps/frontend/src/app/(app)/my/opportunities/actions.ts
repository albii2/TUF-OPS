'use server'

import { requireSession } from "@/lib/auth/session";
import { getVisibleOpportunities } from "@/lib/auth/visibility";

export async function getMyOpportunities() {
    const session = await requireSession();
    const opportunities = await getVisibleOpportunities(session.user, {
        includeUnassignedForDirector: false,
    });
    
    return opportunities.filter((opp) => opp.organization && opp.ownerId === parseInt(session.user.id, 10));
}
