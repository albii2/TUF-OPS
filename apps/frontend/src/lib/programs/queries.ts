import { prisma } from "@/lib/prisma";

// We are using this to ensure we are always fetching the same data shape
const programWithIncludes = {
    include: { opportunities: true, owner: true, contacts: true },
};

export async function getPrograms() {
  return await prisma.program.findMany(programWithIncludes);
}

export async function getProgram(id: number) {
    const program = await prisma.program.findUnique({
        where: { id },
        ...programWithIncludes,
    });
    
    if (!program) {
        // Adhering to the 'return null' contract for not found records
        return null;
    }
    return program;
}
