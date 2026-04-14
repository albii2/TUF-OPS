"use server";

import { revalidatePath } from "next/cache";
import { updateOrganization } from "@/lib/organizations/mutations";
import { updateOrganizationSchema } from "@/lib/organizations/validation";
import { OrganizationStatus } from '@prisma/client';

export async function updateOrganizationAction(input: {
  id: number;
  name: string;
  status: OrganizationStatus;
  ownerId?: number | null;
  zohoAccountId?: string | null;
}) {
  const parsed = updateOrganizationSchema.parse({
    ...input,
    id: String(input.id), // Zod schema expects a string
    ownerId: String(input.ownerId ?? ""),
  });

  await updateOrganization({
    id: input.id,
    name: parsed.name,
    status: parsed.status,
    ownerId: input.ownerId ?? null,
    zohoAccountId: parsed.zohoAccountId ?? null,
  });

  revalidatePath(`/organizations/${parsed.id}`);
  revalidatePath(`/organizations`);
  revalidatePath("/dashboard");
}
