import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

async function main() {
  console.log("Starting seed...");

  // Teardown in reverse order of dependency
  console.log("Deleting existing data...");
  await prisma.repActivity.deleteMany({});
  await prisma.opportunityNote.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.uniformOrderLine.deleteMany({});
  await prisma.rosterRow.deleteMany({});
  await prisma.rosterUpload.deleteMany({});
  await prisma.uniformOrder.deleteMany({});
  await prisma.mockupVersion.deleteMany({});
  await prisma.mockup.deleteMany({});
  await prisma.sampleRequest.deleteMany({});
  await prisma.storeProductPricing.deleteMany({});
  await prisma.fundraisingPayout.deleteMany({});
  await prisma.teamStore.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.ordersRaw.deleteMany({});
  await prisma.teamAsset.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Finished deleting data.");

  // Seed one clean admin user
  console.log("Seeding admin user...");
  const email = "admin@tufops.com"
  const plainPassword = "admin123"
  const password_hash = await bcrypt.hash(plainPassword, 10)

  await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name: "TUF Admin",
      role: "admin",
    },
  })

  console.log(`Seeded 1 admin user: ${email}`)
  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
