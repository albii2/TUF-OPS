
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepValidateData() {
  console.log('--- Starting Deep Data Validation ---');
  try {
    const users = await prisma.user.findMany({ take: 5, include: { manager: true } });
    console.log(`
--- Sample Users (${users.length}) ---
`, users);

    const orgs = await prisma.organization.findMany({ take: 5, include: { owner: true } });
    console.log(`
--- Sample Organizations (${orgs.length}) ---
`, orgs);

    const opps = await prisma.opportunity.findMany({ take: 5, include: { owner: true, organization: true } });
    console.log(`
--- Sample Opportunities (${opps.length}) ---
`, opps);

    if (users.length > 0 && orgs.length > 0 && opps.length > 0) {
      console.log('\n🎉 SUCCESS: The database contains valid, structured data.');
    } else {
      console.error('\n❌ FAILURE: The database is missing critical data.');
    }

  } catch (error) {
    console.error('🔥 An error occurred during deep validation:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n--- Deep Data Validation Complete ---');
  }
}

deepValidateData();
