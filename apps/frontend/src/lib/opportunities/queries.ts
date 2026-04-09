import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Opportunity, Organization, User, Mockup } from "@prisma/client";

export type OpportunityWithDetails = Opportunity & { 
    organization: Organization | null; 
    owner: User | null; 
    mockup: Mockup | null;
};

export async function getOpportunity(id: string): Promise<OpportunityWithDetails | null> {
    const opportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id, 10) },
        include: { organization: true, owner: true, mockup: true },
    });
    
    if (!opportunity || !opportunity.organization) {
        notFound();
    }
    return opportunity;
}