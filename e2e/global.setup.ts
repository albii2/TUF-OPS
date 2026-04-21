import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const authFile = 'e2e/.auth/user.json';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Starting auth setup...');

  // Clean and seed the database
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

  const email = 'admin@tufops.com';
  const plainPassword = 'admin123';
  const password_hash = await bcrypt.hash(plainPassword, 10);

  await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name: 'TUF Admin',
      role: 'admin',
    },
  });

  console.log('Database seeded, proceeding with login...');

  await page.goto(`${baseURL}/auth/signin`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', plainPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseURL}/dashboard`);

  await page.context().storageState({ path: authFile });
  await browser.close();
  console.log('Auth setup complete.');
}

export default globalSetup;
