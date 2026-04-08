'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'
import { z } from 'zod'

const FormSchema = z.object({
    id: z.string(),
    name: z.string().min(3, { message: 'Must be 3 or more characters long' }),
    organization_id: z.coerce.number(),
    stage: z.nativeEnum(OpportunityStage),
    estimated_value: z.coerce.number(),
    probability: z.coerce.number(),
});

const CreateOpportunity = FormSchema.omit({ id: true });

export type State = {
    errors?: {
      name?: string[];
      organization_id?: string[];
      // add other fields as necessary
    };
    message?: string;
};

export async function createOpportunity(prevState: State, formData: FormData) {
    const validatedFields = CreateOpportunity.safeParse({
        name: formData.get('name'),
        organization_id: formData.get('organizationId'),
        stage: formData.get('stage'),
        estimated_value: formData.get('estimatedValue'),
        probability: formData.get('probability'),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Create Opportunity.',
        };
    }

    try {
        await prisma.opportunity.create({
            data: validatedFields.data,
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Opportunity.',
        };
    }

    revalidatePath('/opportunities');
    redirect('/opportunities');
}
