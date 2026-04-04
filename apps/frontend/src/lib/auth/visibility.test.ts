import { getTeamOpportunityFilter } from './visibility';
import { prisma } from '@/lib/prisma';

describe('getTeamOpportunityFilter', () => {
  it('should return a filter for a director and their subordinates', async () => {
    // This test requires a database connection and seeded data.
    // You would need to mock prisma for a true unit test.
    const directorId = 1; // Assuming a director with ID 1 exists
    const filter = await getTeamOpportunityFilter(directorId, true);
    expect(filter).toEqual({
      OR: [
        { ownerId: { in: [1] } },
        { ownerId: null },
      ],
    });
  });
});
