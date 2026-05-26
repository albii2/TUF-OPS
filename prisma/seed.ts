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

  // Seed only the current hiring-phase team accounts
  console.log("Seeding users...");
  const baseUsers = [
    { email: "albii2@tufops.com", password: "0000", full_name: "Albii2", role: "admin" },
    { email: "jason.wolf@tufops.com", password: "2741", full_name: "Jason Wolf", role: "director" },
    { email: "primeau.hill@tufops.com", password: "3904", full_name: "Primeau Hill", role: "sales_rep" },
  ];

  for (const row of baseUsers) {
    const password_hash = await bcrypt.hash(row.password, 10);
    await prisma.user.create({
      data: {
        email: row.email,
        password_hash,
        full_name: row.full_name,
        role: row.role,
      },
    });
  }

  console.log(`Seeded ${baseUsers.length} users (current team only).`)
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
