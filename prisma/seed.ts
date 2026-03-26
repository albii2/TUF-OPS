const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  console.log("Deleting existing data...");
  await prisma.opportunity.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.create({
    data: {
      email: "admin@tufops.com",
      password_hash: hashedPassword,
      name: "Admin User",
      role: "admin",
    },
  });

  console.log("Creating organization...");
  const organization = await prisma.organization.create({
    data: {
      name: "Test Organization",
      ownerId: user.id,
    },
  });

  console.log("Creating opportunity...");
  await prisma.opportunity.create({
    data: {
      organization_id: organization.id,
      name: "Test Opportunity",
      stage: "discovery",
      ownerId: user.id,
      estimated_value: 10000,
      probability: 50,
      nextStep: "Follow up call",
      nextStepDueDate: new Date(),
    },
  });

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
