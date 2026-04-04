const { PrismaClient, UserRole, OpportunityStage } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  console.log("Deleting existing data...");
  await prisma.activity.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating users...");
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@tufops.com",
      password_hash: adminPass,
      name: "Alex Admin",
      role: UserRole.admin,
    },
  });

  const directorPass = await bcrypt.hash("director123", 10);
  const director = await prisma.user.create({
    data: {
      email: "director@tufops.com",
      password_hash: directorPass,
      name: "Dana Director",
      role: UserRole.director,
    },
  });

  const repPass = await bcrypt.hash("rep123", 10);
  const rep = await prisma.user.create({
    data: {
      email: "rep@tufops.com",
      password_hash: repPass,
      name: "Riley Rep",
      role: UserRole.rep,
      managerId: director.id, // Riley reports to Dana
    },
  });

  console.log("Creating sample programs and opportunities...");

  // Program owned by the Director
  const prog1 = await prisma.organization.create({
    data: {
      name: "Northwood High School",
      ownerId: director.id,
      opportunities: {
        create: [
          {
            name: "Varsity Football Uniforms",
            stage: OpportunityStage.lead, // Corrected from 'discovery'
            ownerId: director.id,
            estimated_value: 25000,
            probability: 20,
            nextStep: "Initial meeting with AD",
          },
        ],
      },
    },
  });

  // Program owned by the Rep
  const prog2 = await prisma.organization.create({
    data: {
      name: "Southside Youth Soccer League",
      ownerId: rep.id,
      opportunities: {
        create: [
          {
            name: "U12 Travel Team Kits",
            stage: OpportunityStage.mockup, // Corrected from 'proposal'
            ownerId: rep.id,
            estimated_value: 12000,
            probability: 60,
            nextStep: "Send revised quote",
          },
          {
            name: "Coaches Polos",
            stage: OpportunityStage.closed_won,
            ownerId: rep.id,
            estimated_value: 3000,
            probability: 100,
          },
        ],
      },
    },
  });

  console.log(`Seed finished. Created 3 users, 2 programs, and 3 opportunities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
