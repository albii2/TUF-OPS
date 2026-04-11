import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Opportunity, Organization, User, Mockup, OpportunityEvent } from "@prisma/client";

export type OpportunityWithDetails = Opportunity & { 
    organization: Organization | null; 
    owner: User | null; 
    mockup: Mockup | null;
    events: (OpportunityEvent & { actorUser: { name: string | null } })[];
};

export async function getOpportunity(id: string): Promise<OpportunityWithDetails | null> {
    const opportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id, 10) },
        include: { 
            organization: true, 
            owner: true, 
            events: {
                include: {
                    actorUser: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            mockup: true 
        },
    });
    
    if (!opportunity || !opportunity.organization) {
        notFound();
    }
    return opportunity;
}