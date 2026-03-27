'use server'

import { prisma } from "@/lib/prisma";

export async function getOrganizations() {
    return await prisma.organization.findMany({ include: { owner: true } });
}
