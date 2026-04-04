'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import { addContactSchema } from "@/lib/validation/organization";

export async function addContact(input: unknown) {
  const session = await requireSession();
  const data = addContactSchema.parse(input);

  const contact = await prisma.contact.create({
    data,
  });

  revalidatePath(`/organizations/${data.organizationId}`);

  return contact;
}
