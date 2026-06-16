export type CreativeRequestStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CLARIFICATION' | 'IN_PROGRESS' | 'INTERNAL_REVIEW' | 'AWAITING_SALES_APPROVAL' | 'REVISION_REQUESTED' | 'FINAL_APPROVED' | 'DELIVERED' | 'ARCHIVED';
export type CreativeRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CreativeRequestType = 'MOCKUP' | 'APPAREL_GRAPHIC' | 'COLLECTION_DESIGN' | 'SOCIAL_MEDIA_GRAPHIC' | 'EVENT_LOGO' | 'BRAND_DOCUMENT' | 'SALES_FLYER' | 'OTHER';
export type DesignTeam = 'APPAREL_MOCKUP' | 'SOCIAL_BRAND';
export interface CreativeRequest {
    id: number;
    opportunity_id: number;
    organization_id: number | null;
    created_by_user_id: number;
    assigned_designer_id: number | null;
    request_type: CreativeRequestType;
    design_team: DesignTeam;
    priority: CreativeRequestPriority;
    title: string;
    sport: string | null;
    season: string | null;
    needed_items: string[];
    design_notes: string;
    inspiration_notes: string | null;
    due_date: string | null;
    asset_links: string | null;
    internal_notes: string | null;
    status: CreativeRequestStatus;
    trello_card_id: string | null;
    trello_card_url: string | null;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=creative-requests.interface.d.ts.map