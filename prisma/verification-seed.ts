const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting verification seed...");

  console.log("Deleting existing data...");
  await prisma.opportunity.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating users...");
  const hashedPassword = await bcrypt.hash("password", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@tufops.com",
      password_hash: hashedPassword,
      name: "Admin User",
      role: "admin",
    },
  });

  const director = await prisma.user.create({
    data: {
      email: "director@tufops.com",
      password_hash: hashedPassword,
      name: "Director Dan",
      role: "director",
    },
  });

  const rep1 = await prisma.user.create({
    data: {
      email: "rep1@tufops.com",
      password_hash: hashedPassword,
      name: "Rep Ron",
      role: "rep",
      managerId: director.id,
    },
  });

  const rep2 = await prisma.user.create({
    data: {
      email: "rep2@tufops.com",
      password_hash: hashedPassword,
      name: "Rep Rita",
      role: "rep",
      managerId: director.id,
    },
  });

  const unaffiliatedRep = await prisma.user.create({
    data: {
      email: "unaffiliated@tufops.com",
      password_hash: hashedPassword,
      name: "Unaffiliated Ursula",
      role: "rep",
    },
  });

  console.log("Creating organizations...");
  const org1 = await prisma.organization.create({ data: { name: "Org 1" } });
  const org2 = await prisma.organization.create({ data: { name: "Org 2" } });
  const org3 = await prisma.organization.create({ data: { name: "Org 3" } });
  const org4 = await prisma.organization.create({ data: { name: "Org 4" } });
  const org5 = await prisma.organization.create({ data: { name: "Org 5" } });


  console.log("Creating opportunities...");
  await prisma.opportunity.create({
    data: {
      name: "Director's Deal",
      organization_id: org1.id,
      ownerId: director.id,
      stage: "lead",
    },
  });

  await prisma.opportunity.create({
    data: {
      name: "Rep Ron's Deal",
      organization_id: org2.id,
      ownerId: rep1.id,
      stage: "contacted",
    },
  });

  await prisma.opportunity.create({
    data: {
      name: "Rep Rita's Deal",
      organization_id: org3.id,
      ownerId: rep2.id,
      stage: "mockup",
    },
  });

  await prisma.opportunity.create({
    data: {
      name: "Unaffiliated Ursula's Deal",
      organization_id: org4.id,
      ownerId: unaffiliatedRep.id,
      stage: "sample",
    },
  });

  await prisma.opportunity.create({
    data: {
      name: "Unassigned Deal",
      organization_id: org5.id,
      stage: "invoice",
    },
  });

  console.log("Verification seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
