export interface LeadershipComm {
    id: number;
    subject: string;
    recipient: string;
    recipient_role?: string;
    body: string;
    status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    scheduled_for?: string;
    sent_at?: string;
    delivery_channel: string;
    tags: string[];
    ai_draft?: string;
    notes?: string;
    created_by: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
}
export declare function createComm(data: {
    subject: string;
    recipient: string;
    recipient_role?: string;
    body: string;
    status?: string;
    scheduled_for?: string;
    tags?: string[];
    notes?: string;
    created_by: number;
}): Promise<LeadershipComm>;
export declare function getComms(filters?: {
    status?: string;
    recipient?: string;
    scheduled_before?: string;
}): Promise<LeadershipComm[]>;
export declare function getComm(id: number): Promise<LeadershipComm | null>;
export declare function updateComm(id: number, data: {
    subject?: string;
    recipient?: string;
    recipient_role?: string;
    body?: string;
    status?: string;
    scheduled_for?: string;
    notes?: string;
    tags?: string[];
    updated_by: number;
}): Promise<LeadershipComm | null>;
export declare function deleteComm(id: number): Promise<boolean>;
export declare function getScheduledComms(): Promise<LeadershipComm[]>;
export declare function getUpcomingComms(hours?: number): Promise<LeadershipComm[]>;
//# sourceMappingURL=comms.service.d.ts.map