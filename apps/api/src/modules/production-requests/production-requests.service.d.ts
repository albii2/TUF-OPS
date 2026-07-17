import { ProductionRequest, ProductionRequestStatus } from './production-requests.interface';
export declare function createProductionRequest(data: Partial<ProductionRequest>): Promise<ProductionRequest>;
export declare function updateProductionRequestStatus(id: number, status: ProductionRequestStatus): Promise<ProductionRequest>;
export declare function getProductionRequestsByOpportunity(opportunityId: number): Promise<ProductionRequest[]>;
//# sourceMappingURL=production-requests.service.d.ts.map