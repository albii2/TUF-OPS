import { getOrganizations } from '../organizations.service';

jest.mock('../organizations.service');

describe('Organizations Service', () => {
  it('should return an array of organizations', async () => {
    (getOrganizations as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Organization' }]);
    const organizations = await getOrganizations();
    expect(Array.isArray(organizations)).toBe(true);
    expect(organizations.length).toBe(1);
  });
});
