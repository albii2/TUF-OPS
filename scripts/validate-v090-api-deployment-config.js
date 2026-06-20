const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

function validate() {
  console.log('Running API Deployment Configuration checks...');

  // 1. API App exists
  const apiDir = path.join(rootDir, 'apps/api');
  if (!fs.existsSync(apiDir)) {
    console.error('❌ Error: apps/api directory is missing.');
    process.exit(1);
  }
  console.log('✅ apps/api directory exists.');

  // 2. Start/build commands exist in apps/api/package.json
  const apiPkgPath = path.join(apiDir, 'package.json');
  if (!fs.existsSync(apiPkgPath)) {
    console.error('❌ Error: apps/api/package.json is missing.');
    process.exit(1);
  }
  const apiPkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf8'));
  if (!apiPkg.scripts || !apiPkg.scripts.build || !apiPkg.scripts.start) {
    console.error('❌ Error: apps/api/package.json is missing "build" or "start" script.');
    process.exit(1);
  }
  console.log('✅ apps/api/package.json contains build and start scripts.');

  // 3. Training routes exist in apps/api/src/index.ts
  const apiIndexPath = path.join(apiDir, 'src/index.ts');
  if (!fs.existsSync(apiIndexPath)) {
    console.error('❌ Error: apps/api/src/index.ts is missing.');
    process.exit(1);
  }
  const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');
  if (!apiIndexContent.includes('/training') || !apiIndexContent.includes('/api/v1/training')) {
    console.error('❌ Error: training routes are not properly registered in apps/api/src/index.ts.');
    process.exit(1);
  }
  console.log('✅ apps/api/src/index.ts registers training routes.');

  // 4. Frontend references VITE_API_BASE_URL
  const webDir = path.join(rootDir, 'apps/web');
  const webConfigPath = path.join(webDir, 'src/services/apiClient.ts');
  let referencesEnv = false;
  
  // Also check general source files for references to VITE_API_BASE_URL
  const filesToScan = [
    path.join(webDir, 'src/components/TrainingPortalPage.tsx'),
    path.join(webDir, 'src/services/apiClient.ts'),
    path.join(webDir, 'src/auth.ts')
  ];

  for (const file of filesToScan) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('VITE_API_BASE_URL')) {
        referencesEnv = true;
      }
    }
  }

  if (!referencesEnv) {
    console.error('❌ Error: Frontend code does not reference VITE_API_BASE_URL.');
    process.exit(1);
  }
  console.log('✅ Frontend references VITE_API_BASE_URL environment variable.');

  // 5. Docs explain Vercel frontend -> API -> Railway Postgres
  const guideDoc = path.join(rootDir, 'docs/V0_9_0_API_DEPLOYMENT_GUIDE.md');
  if (!fs.existsSync(guideDoc)) {
    console.error('❌ Error: docs/V0_9_0_API_DEPLOYMENT_GUIDE.md is missing.');
    process.exit(1);
  }
  const guideContent = fs.readFileSync(guideDoc, 'utf8');
  if (!guideContent.includes('Vercel') || !guideContent.includes('Railway') || !guideContent.includes('Postgres')) {
    console.error('❌ Error: V0_9_0_API_DEPLOYMENT_GUIDE.md does not explain Vercel -> API -> Postgres flow.');
    process.exit(1);
  }
  console.log('✅ docs/V0_9_0_API_DEPLOYMENT_GUIDE.md explains the Vercel -> API -> Postgres architecture.');

  console.log('🎉 API deployment configuration checks passed successfully.');
}

validate();
