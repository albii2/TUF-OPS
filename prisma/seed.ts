import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const baselineUsers = [
  { email: "abradshaw@tufsports.us", password: "8188", full_name: "A Bradshaw VP", role: "admin" },
  { email: "primeau.hill@tufsports.us", password: "7428", full_name: "Primeau Hill", role: "director" },
  { email: "jvmulder@gmail.com", password: "6187", full_name: "Jason Mulder", role: "sales_rep" },
  { email: "lundbergdave18@gmail.com", password: "6243", full_name: "David Lundberg", role: "sales_rep" },
  { email: "shaylahilliard17@gmail.com", password: "5219", full_name: "Shayla Hilliard", role: "sales_rep" },
  { email: "jhoffman@kipsu.com", password: "5080", full_name: "Josh Hoffman", role: "sales_rep" },
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
