import type { SafeUser } from '../users/users.interface';
import type { ExecutiveSummary, ParticipantSummary, ParticipantDetail, LogEventPayload } from './academy-command.interface';
export declare function getExecutiveSummary(actor?: SafeUser | null): Promise<ExecutiveSummary>;
export declare function getParticipants(actor?: SafeUser | null): Promise<ParticipantSummary[]>;
export declare function getParticipantDetail(userId: number, actor?: SafeUser | null): Promise<ParticipantDetail | null>;
export declare function getRecentActivityFeed(limit?: number): Promise<Array<{
    id: number;
    userName: string;
    eventType: string;
    description: string;
    timestamp: string;
}>>;
export declare function logEvent(userId: number, payload: LogEventPayload): Promise<void>;
//# sourceMappingURL=academy-command.service.d.ts.map