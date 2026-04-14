import { prisma } from "@/lib/prisma";
import { OrganizationStatus } from "@prisma/client";

type UpdateOrganizationInput = {
  id: number;
  name: string;
  status: OrganizationStatus;
  ownerId?: number | null;
  zohoAccountId?: string | null;
};

export async function updateOrganization(input: UpdateOrganizationInput) {
  return prisma.organization.update({
    where: { id: input.id },
    data: {
      name: input.name,
      status: input.status,
      ownerId: input.ownerId ?? null,
      zoho_account_id: input.zohoAccountId ?? null,
    },
  });
}
