import type { Issue, CreateIssueInput, UpdateIssueInput, UpdateIssueStatusInput, ListIssuesQuery } from './issues.interface';
export declare function listIssues(query: ListIssuesQuery): Promise<Issue[]>;
export declare function getIssueById(id: number): Promise<Issue | null>;
export declare function createIssue(input: CreateIssueInput, submittedBy: number): Promise<Issue>;
export declare function updateIssue(id: number, input: UpdateIssueInput): Promise<Issue | null>;
export declare function updateIssueStatus(id: number, input: UpdateIssueStatusInput): Promise<Issue | null>;
//# sourceMappingURL=issues.service.d.ts.map