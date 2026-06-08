import { createRequire } from 'module'

type PrismaClientLike = Record<string | symbol, unknown>
type PrismaClientConstructor = new () => PrismaClientLike

const runtimeRequire = createRequire(import.meta.url)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientLike
}

function loadPrismaClient(): PrismaClientConstructor {
  const clientModule = runtimeRequire('@prisma/client') as {
    PrismaClient?: PrismaClientConstructor
  }

  if (!clientModule.PrismaClient) {
    throw new Error('PrismaClient is unavailable. Run `prisma generate` before using database-backed routes.')
  }

  return clientModule.PrismaClient
}

function getPrismaClient(): PrismaClientLike {
  if (!globalForPrisma.prisma) {
    const PrismaClient = loadPrismaClient()
    globalForPrisma.prisma = new PrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClientLike, {
  get(_target, property) {
    return getPrismaClient()[property]
  },
}) as any
