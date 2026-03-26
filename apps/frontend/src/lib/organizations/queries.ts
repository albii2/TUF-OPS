import { prisma } from "@/lib/prisma";

// We are using this to ensure we are always fetching the same data shape
const organizationWithIncludes = {
    include: { opportunities: true, owner: true },
};

export async function getOrganizations() {
  return await prisma.organization.findMany(organizationWithIncludes);
}

export async function getOrganization(id: number) {
    const organization = await prisma.organization.findUnique({
        where: { id },
        ...organizationWithIncludes,
    });
    
    if (!organization) {
        // Adhering to the 'return null' contract for not found records
        return null;
    }
    return organization;
}
