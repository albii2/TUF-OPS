'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createMockupRequestCard } from "@/lib/trello/service";

const requestMockupSchema = z.object({
    opportunityId: z.number(),
    notes: z.string().optional(),
    jerseyNumber: z.string().optional(),
    logo: z.string().optional(),
    colors: z.string().optional(),
});

export async function requestMockup(input: unknown) {
    const session = await requireSession();
    const { opportunityId, notes, jerseyNumber, logo, colors } = requestMockupSchema.parse(input);

    const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { organization: true },
    });

    if (!opportunity) {
        throw new Error("Opportunity not found.");
    }

    const mockup = await prisma.mockupRequest.create({
        data: {
            opportunityId,
            notes,
            jerseyNumber,
            logo,
            colors,
            status: "Requested",
        }
    });

    // Create Trello Card
    const cardDescription = `
Organization: ${opportunity.organization.name}

**Jersey Number(s):**
${jerseyNumber || 'N/A'}

**Logo Details:**
${logo || 'N/A'}

**Colors:**
${colors || 'N/A'}

**Additional Notes:**
${notes || "No notes provided."}
    `;

    await createMockupRequestCard({
        name: `Mockup Request: ${opportunity.name}`,
        desc: cardDescription,
    });

    revalidatePath(`/orders/.*`, 'page'); // Revalidate all order pages

    return mockup;
}
