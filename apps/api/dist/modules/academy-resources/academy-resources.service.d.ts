export interface AcademyResource {
    id: number;
    slug: string;
    title: string;
    kind: string;
    body_markdown: string | null;
    external_url: string | null;
    sort_order: number;
    is_active: boolean;
    updated_at: string;
}
export declare function listResources(): Promise<AcademyResource[]>;
export declare function getResourceBySlug(slug: string): Promise<AcademyResource | null>;
//# sourceMappingURL=academy-resources.service.d.ts.map