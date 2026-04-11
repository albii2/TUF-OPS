
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function validateData() {
  console.log('--- Starting Data Validation ---');

  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);

    const orgCount = await prisma.organization.count();
    console.log(`✅ Organizations: ${orgCount}`);

    const oppCount = await prisma.opportunity.count();
    console.log(`✅ Opportunities: ${oppCount}`);

    if (userCount > 0 && orgCount > 0 && oppCount > 0) {
      console.log('\n🎉 SUCCESS: The database is correctly populated with mock data.');
    } else {
      console.error('\n❌ FAILURE: The database is missing data. Counts are zero.');
    }

  } catch (error) {
    console.error('🔥 An error occurred while connecting to or querying the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n--- Data Validation Complete ---');
  }
}

validateData();
