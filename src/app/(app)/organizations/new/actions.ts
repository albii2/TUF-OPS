'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const FormSchema = z.object({
    id: z.string(),
    name: z.string().min(3, { message: 'Must be 3 or more characters long' }),
});

const CreateOrganization = FormSchema.omit({ id: true });

export type State = {
    errors?: {
      name?: string[];
    };
    message?: string | null;
};

export async function createOrganization(prevState: State, formData: FormData) {
    const validatedFields = CreateOrganization.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Create Organization.',
        };
    }

    try {
        await prisma.organization.create({
            data: {
                name: validatedFields.data.name,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Organization.',
        };
    }

    revalidatePath('/organizations');
    redirect('/organizations');
}
