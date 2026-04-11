
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const FormSchema = z.object({
    opportunityId: z.coerce.number(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    tertiaryColor: z.string(),
    jerseyNumbers: z.string().optional(),
    notes: z.string().optional(),
});

export type State = {
    errors?: {
        primaryColor?: string[];
        secondaryColor?: string[];
        tertiaryColor?: string[];
        jerseyNumbers?: string[];
        notes?: string[];
        logoUrl?: string[];
    };
    message?: string;
};

export async function createMockupRequest(prevState: State, formData: FormData) {
    const validatedFields = FormSchema.safeParse({
        opportunityId: formData.get('opportunityId'),
        primaryColor: formData.get('primaryColor'),
        secondaryColor: formData.get('secondaryColor'),
        tertiaryColor: formData.get('tertiaryColor'),
        jerseyNumbers: formData.get('jerseyNumbers'),
        notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Mockup Request.',
        };
    }

    const logoFile = formData.get('logoFile') as File;
    let logoUrl = '';

    if (logoFile && logoFile.size > 0) {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${logoFile.name}`;
        const path = join(process.cwd(), 'public/uploads', filename);
        await writeFile(path, buffer);
        logoUrl = `/uploads/${filename}`;
    }

    try {
        await prisma.mockup.create({
            data: {
                opportunityId: validatedFields.data.opportunityId,
                primaryColor: validatedFields.data.primaryColor,
                secondaryColor: validatedFields.data.secondaryColor,
                tertiaryColor: validatedFields.data.tertiaryColor,
                jerseyNumbers: validatedFields.data.jerseyNumbers,
                notes: validatedFields.data.notes,
                logoUrl: logoUrl,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Mockup Request.',
        };
    }

    revalidatePath(`/opportunities/${validatedFields.data.opportunityId}`);
    redirect(`/opportunities/${validatedFields.data.opportunityId}`);
}
