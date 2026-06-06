import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const baselineUsers = [
  { email: "owner@tuf.local", password: "0000", full_name: "Coach Bradshaw", role: "admin" },
  { email: "primeau.director@tuf.local", password: "3904", full_name: "Primeau Hill Director", role: "director" },
  { email: "test.director@tuf.local", password: "2468", full_name: "Test Director", role: "director" },
  { email: "test.rep@tuf.local", password: "1357", full_name: "Test Rep", role: "sales_rep" },
]

async function cleanupDemoData() {
  console.log("ALLOW_DESTRUCTIVE_SEED=true detected. Archiving demo cleanup through destructive table cleanup.");
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
  await prisma.user.deleteMany({ where: { email: { notIn: baselineUsers.map((user) => user.email) } } });
}

async function main() {
  console.log("Starting V0.8.5 baseline seed...");

  if (process.env.ALLOW_DESTRUCTIVE_SEED === "true") {
    await cleanupDemoData();
  } else {
    console.log("Skipping destructive cleanup. Set ALLOW_DESTRUCTIVE_SEED=true only after confirming no real production data will be removed.");
  }

  for (const row of baselineUsers) {
    const password_hash = await bcrypt.hash(row.password, 10);
    await prisma.user.upsert({
      where: { email: row.email },
      update: {
        password_hash,
        full_name: row.full_name,
        role: row.role,
      },
      create: {
        email: row.email,
        password_hash,
        full_name: row.full_name,
        role: row.role,
      },
    });
  }

  console.log(`Seeded ${baselineUsers.length} approved V0.8.5 users.`);
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
