import { CreativeRequest } from './creative-requests.interface';
export declare function listCreativeRequestsByOpportunity(opportunityId: number): Promise<CreativeRequest[]>;
export declare function createCreativeRequest(opportunityId: number, payload: Partial<CreativeRequest>): Promise<CreativeRequest>;
export declare function updateCreativeRequest(id: number, updates: Partial<CreativeRequest>): Promise<CreativeRequest>;
export declare function createTrelloCardForCreativeRequest(_creativeRequestId: number): Promise<void>;
//# sourceMappingURL=creative-requests.service.d.ts.map