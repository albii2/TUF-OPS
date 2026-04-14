import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function getOpportunity(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id, 10) },
        include: { organization: true, owner: true },
    });
    
    if (!opportunity || !opportunity.organization) {
        notFound();
    }
    return opportunity;
}
