"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const organizations_service_1 = require("../organizations.service");
jest.mock('../organizations.service');
describe('Organizations Service', () => {
    it('should return an array of organizations', async () => {
        organizations_service_1.getOrganizations.mockResolvedValue([{ id: 1, name: 'Test Organization' }]);
        const organizations = await (0, organizations_service_1.getOrganizations)();
        expect(Array.isArray(organizations)).toBe(true);
        expect(organizations.length).toBe(1);
    });
});
//# sourceMappingURL=organizations.test.js.map