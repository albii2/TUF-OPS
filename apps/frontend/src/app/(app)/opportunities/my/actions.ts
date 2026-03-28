'use server'

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { quickUpdateOpportunitySchema } from '@/lib/validation/opportunity';

export async function quickUpdateOpportunity(input: unknown) {
    const session = await requireSession();
    const data = quickUpdateOpportunitySchema.parse(input);
    const opportunityId = parseInt(data.id, 10);

    // Verify ownership
    const opportunity = await prisma.opportunity.findFirst({
        where: {
            id: opportunityId,
            ownerId: parseInt(session.user.id)
        }
    });

    if (!opportunity) {
        throw new Error("Opportunity not found or you don't have permission to edit it.");
    }

    const updated = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
            stage: data.stage,
            nextStep: data.nextStep,
            nextStepDueDate: data.nextStepDueDate,
        },
    });

    revalidatePath('/opportunities/my');
    revalidatePath('/dashboard');

    return updated;
}
