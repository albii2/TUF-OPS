export type CreativeRequestType = 'MOCKUP' | 'APPAREL_GRAPHIC' | 'COLLECTION_DESIGN' | 'SOCIAL_MEDIA_GRAPHIC' | 'EVENT_LOGO' | 'BRAND_DOCUMENT' | 'SALES_FLYER' | 'OTHER';
export type DesignTeam = 'APPAREL_MOCKUP' | 'SOCIAL_BRAND';
export type CreativePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CreativeStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CLARIFICATION' | 'IN_PROGRESS' | 'INTERNAL_REVIEW' | 'AWAITING_SALES_APPROVAL' | 'REVISION_REQUESTED' | 'FINAL_APPROVED' | 'DELIVERED' | 'ARCHIVED';
export type TrelloDispatchStatus = 'NOT_CONFIGURED' | 'PENDING' | 'SENT' | 'FAILED';
export declare const neededItemOptions: readonly ["Home Uniform", "Away Uniform", "Alternate Uniform", "Hoodie", "T-Shirt", "Shorts", "Team Store Graphic", "Player Pack", "Letterman Jacket", "Social Post", "Story Graphic", "Event Logo", "Flyer", "PDF / Brand Document", "Other"];
export type CreativeRequest = {
    id: string;
    opportunityId: string;
    organizationId: string;
    createdBy: string;
    assignedDesigner?: string;
    requestType: CreativeRequestType;
    designTeam: DesignTeam;
    priority: CreativePriority;
    title: string;
    sport?: string;
    season?: string;
    neededItems: string[];
    designNotes: string;
    inspirationNotes?: string;
    dueDate?: string;
    assetLinks?: string;
    internalNotes?: string;
    status: CreativeStatus;
    trelloCardUrl?: string;
    trelloCardId?: string;
    trelloDispatchStatus?: TrelloDispatchStatus;
    trelloDispatchError?: string;
    createdAt: string;
    updatedAt: string;
};
export declare function isTrelloConfigured(): boolean;
export declare function listCreativeRequestsByOpportunity(opportunityId: string): CreativeRequest[];
export declare function createCreativeRequest(input: Omit<CreativeRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy'> & {
    status?: CreativeStatus;
}): Promise<CreativeRequest>;
//# sourceMappingURL=creativeRequestsService.d.ts.map