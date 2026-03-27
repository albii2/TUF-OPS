import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding 10 test organizations...')
    for (let i = 1; i <= 10; i++) {
        await prisma.organization.create({
            data: {
                name: `Test Organization ${i}`,
                status: 'active',
            },
        })
    }
    console.log('Seeding complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
