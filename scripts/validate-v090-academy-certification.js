const fs = require('node:fs');

const errors = [];
const read = (file) => fs.readFileSync(file, 'utf8');
const must = (file, needle, message) => {
  if (!read(file).includes(needle)) errors.push(`${file}: ${message}`);
};

must('packages/database/migrations/1900000010000_v090_training_quizzes.js', 'quiz_json', 'quiz seed must add module quiz_json');
must('packages/database/migrations/1900000010000_v090_training_quizzes.js', 'passing_score', 'quiz seed must set passing_score');
must('apps/api/src/modules/training/training.routes.ts', '/assessments/submit', 'quiz assessment route missing');
must('apps/api/src/modules/training/training.service.ts', 'submitModuleAssessment', 'quiz submission service missing');
must('apps/api/src/modules/training/training.service.ts', 'passedAssessments', 'certification must require passed quizzes for quiz modules');
must('apps/web/src/components/TrainingModuleDetail.tsx', 'Certification Quiz', 'module detail must render certification quiz');
must('apps/web/src/components/TrainingModuleDetail.tsx', 'Submit Quiz & Complete', 'module completion must submit quiz');
must('apps/web/src/hooks/useTrainingEnrollment.ts', 'practicalExerciseCompleted', 'local certification must include practical exercise gate');
must('apps/web/src/config/roles.ts', 'ecosystem', 'director/owner ecosystem navigation must be configured');
if (read('apps/web/src/config/roles.ts').includes('data_health')) errors.push('apps/web/src/config/roles.ts: Data Health sidebar key still configured');
must('apps/web/src/pages/OrganizationsPage.tsx', 'const PAGE_SIZE = 100', 'organizations page must show up to 100 schools');
must('apps/web/src/pages/OpportunitiesPage.tsx', 'const PAGE_SIZE = 100', 'opportunities page must show up to 100 opportunities');
must('apps/web/src/services/organizationsService.ts', 'PRIMEAU_DIRECTOR_TERRITORIES', 'Primeau Metro/North director assignment helper missing');
must('packages/database/seed_leads_from_csv.js', 'normalizeZone', 'lead seed must assign zone from CSV/address');
must('packages/database/seed_leads_from_csv.js', 'getPrimeauDirectorId', 'lead seed must assign Metro/North to Primeau when available');
must('packages/database/migrations/1900000011000_v090_lead_zones_primeau.js', 'tuf_zone', 'lead zone migration missing');
must('docs/V0_9_0_ACADEMY_CERTIFICATION_SMOKE_TEST.md', 'Primeau Metro/North visibility', 'Academy certification smoke doc missing Primeau visibility test');

if (errors.length) {
  console.error('v0.9 Academy certification validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('v0.9 Academy certification validation passed');
