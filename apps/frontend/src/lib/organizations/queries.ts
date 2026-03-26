import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function getOrganization(id: number) {
    const organization = await prisma.organization.findUnique({
        where: { id },
        include: { opportunities: true, owner: true },
    });
    
    if (!organization) {
        notFound();
    }
    return organization;
}
