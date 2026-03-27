'use server'

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getMyOpportunities() {
    const session = await requireSession();
    // @ts-ignore
    const userId = parseInt(session.user.id, 10);

    const opportunities = await prisma.opportunity.findMany({ 
        where: { ownerId: userId },
        include: { owner: true, organization: true } 
    });
    
    return opportunities.filter(opp => opp.organization);
}
