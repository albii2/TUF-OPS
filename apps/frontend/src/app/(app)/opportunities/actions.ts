'use server'

import { prisma } from "@/lib/prisma";

export async function getOpportunities() {
    const opportunities = await prisma.opportunity.findMany({ 
        include: { owner: true, organization: true } 
    });
    // Filter out opportunities that do not have an organization
    return opportunities.filter(opp => opp.organization);
}
