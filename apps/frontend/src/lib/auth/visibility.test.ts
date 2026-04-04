import { test, expect } from '@playwright/test';
import { getTeamOpportunityFilter } from './visibility';

test.describe('getTeamOpportunityFilter', () => {
  test('should return a filter for a director and their subordinates', async () => {
    // This test requires a database connection and seeded data.
    // You would need to mock prisma for a true unit test.
    const directorId = 1; // Assuming a director with id 1 exists
    const filter = await getTeamOpportunityFilter(directorId);
    expect(filter).toEqual({
      OR: [
        { ownerId: { in: [1] } },
        { ownerId: null },
      ],
    });
  });
});