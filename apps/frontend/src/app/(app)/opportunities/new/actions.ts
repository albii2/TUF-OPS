'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

import { OpportunityStage } from '@prisma/client';

const FormSchema = z.object({
    id: z.string(),
    name: z.string().min(3, { message: 'Must be 3 or more characters long' }),
    program_id: z.coerce.number(),
    stage: z.nativeEnum(OpportunityStage),
    estimated_value: z.coerce.number(),
    probability: z.coerce.number(),
    nextStep: z.string().min(1, { message: 'Next step is required' }),
    nextStepDueDate: z.coerce.date(),
});

const CreateOpportunity = FormSchema.omit({ id: true });

export type State = {
    errors?: {
      name?: string[];
      program_id?: string[];
      nextStep?: string[];
      nextStepDueDate?: string[];
      // add other fields as necessary
    };
    message?: string | null;
};

export async function createOpportunity(prevState: State, formData: FormData) {
    const validatedFields = CreateOpportunity.safeParse({
        name: formData.get('name'),
        program_id: formData.get('programId'),
        stage: formData.get('stage'),
        estimated_value: formData.get('estimatedValue'),
        probability: formData.get('probability'),
        nextStep: formData.get('nextStep'),
        nextStepDueDate: formData.get('nextStepDueDate'),
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
