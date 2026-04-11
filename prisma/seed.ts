
import { PrismaClient, OpportunityStage, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

const SPORTS = [
  'Varsity Football',
  'JV Football',
  'Varsity Basketball (M)',
  'Varsity Basketball (W)',
  'JV Basketball (M)',
  'Varsity Baseball',
  'JV Baseball',
  'Varsity Softball',
  'Varsity Soccer (M)',
  'Varsity Soccer (W)',
  'Track & Field',
  'Cross Country',
  'Volleyball',
  'Wrestling',
  'Swimming & Diving',
  'Lacrosse',
  'Cheerleading',
];

const HIGH_SCHOOLS = [
  'Northwood High',
  'Riverdale High School',
  'Westwood Academy',
  'Eastside Preparatory',
  'South Mountain High',
  'Central City High',
  'Bayview High',
  'Lakefront Secondary',
  'Hillcrest High',
  'Green Valley School for the Arts',
  'Oakwood Collegiate Institute',
  'Pine Ridge High',
  'Maple Leaf High',
  'Cedarbrae High',
  'Golden State Academy',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number, precision = 0): number {
    const factor = Math.pow(10, precision);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

async function main() {
  console.log('🌱 Starting seed...');

  console.log('🗑️ Deleting existing data...');
  await prisma.opportunityEvent.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Create Users ---
  console.log('👤 Creating users...');


  const admin = await prisma.user.create({ data: { email: 'admin@tufops.com', name: 'Albus Bradshaw', role: UserRole.admin } });

  const director1 = await prisma.user.create({ data: { email: 'director.1@tufops.com', name: 'Jordan Belfort', role: UserRole.director } });
  const director2 = await prisma.user.create({ data: { email: 'director.2@tufops.com', name: 'Don Draper', role: UserRole.director } });

  const reps: any[] = [];
  for (let i = 1; i <= 6; i++) {
    const director = i <= 3 ? director1 : director2;
    const rep = await prisma.user.create({
      data: {
        email: `rep.${i}@tufops.com`,
        name: `Sales Rep ${i}`,
        role: UserRole.rep,
        managerId: director.id,
      },
    });
    reps.push(rep);
  }
  console.log(`✓ Created ${2 + reps.length} users`);

  // --- Create Organizations ---
  console.log('🏢 Creating organizations...');
  const allUsers = [admin, director1, director2, ...reps];
  const organizations = [];
  for (const schoolName of HIGH_SCHOOLS) {
    const org = await prisma.organization.create({
      data: {
        name: schoolName,
        owner: { connect: { id: getRandomItem(allUsers).id } },
      },
    });
    organizations.push(org);
  }
  console.log(`✓ Created ${organizations.length} organizations`);

  // --- Create Opportunities ---
  console.log('💼 Creating opportunities...');
  const STAGES = Object.values(OpportunityStage).filter(s => s !== 'closed_won' && s !== 'closed_lost');

  for (let i = 0; i < 50; i++) {
    const org = getRandomItem(organizations);
    const owner = i < 10 ? director1 : getRandomItem(reps);
    const stage = getRandomItem(STAGES);
    const year = 26 + Math.floor(i / 25); // SP26, FA26, etc.
    const season = i % 2 === 0 ? 'SP' : 'FA';
    const sport = getRandomItem(SPORTS);

    const baseDate = subDays(new Date(), getRandomNumber(0, 90));

    await prisma.opportunity.create({
      data: {
        organization: { connect: { id: org.id } },
        name: `${sport} ${season}${year}`,
        stage: stage,
        owner: { connect: { id: owner.id } },
        last_contact_date: subDays(baseDate, getRandomNumber(1, 15)),
        estimated_value: getRandomNumber(1500, 25000, 2),
        probability: getRandomNumber(5, 95),
        nextStep: 'Follow up with AD',
        nextStepDueDate: addDays(baseDate, getRandomNumber(7, 30)),
        createdAt: subDays(baseDate, getRandomNumber(15, 45)),
        updatedAt: baseDate,
      },
    });
  }
  console.log(`✓ Created 50 opportunities`);

  console.log('✅ Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
