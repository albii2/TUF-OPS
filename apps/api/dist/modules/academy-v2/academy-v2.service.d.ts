import { SandboxOrgRow, SandboxContactRow, SandboxOpportunityRow, SandboxActivityRow, SalesExecutionRow, LeadTaxonomyRow, LeadStatus, GraduationRow, QuizAttemptRow, WalkthroughStepRow, VerificationAuditRow, SandboxSummary, GraduationStatus, Phase1Status, Phase2Status, LeadClaimResult } from './academy-v2.interface';
export declare function recordQuizAttempt(userId: number, quizId: string, score: number, passed: boolean, answers: number[]): Promise<QuizAttemptRow>;
export declare function getQuizAttempts(userId: number): Promise<QuizAttemptRow[]>;
export declare function getPhase1Status(userId: number): Promise<Phase1Status>;
export declare function completeWalkthroughStep(userId: number, stepId: string): Promise<WalkthroughStepRow>;
export declare function getWalkthroughSteps(userId: number): Promise<WalkthroughStepRow[]>;
export declare function getPhase2Status(userId: number): Promise<Phase2Status>;
export declare function createSandboxOrg(userId: number, data: Partial<SandboxOrgRow>): Promise<SandboxOrgRow>;
export declare function getSandboxOrgs(userId: number): Promise<SandboxOrgRow[]>;
export declare function getSandboxOrg(userId: number, orgId: number): Promise<SandboxOrgRow | null>;
export declare function updateSandboxOrg(userId: number, orgId: number, data: Partial<SandboxOrgRow>): Promise<SandboxOrgRow>;
export declare function createSandboxContact(userId: number, data: Partial<SandboxContactRow>): Promise<SandboxContactRow>;
export declare function getSandboxContacts(userId: number, orgId?: number): Promise<SandboxContactRow[]>;
export declare function createSandboxOpportunity(userId: number, data: Partial<SandboxOpportunityRow>): Promise<SandboxOpportunityRow>;
export declare function getSandboxOpportunities(userId: number): Promise<SandboxOpportunityRow[]>;
export declare function createSandboxActivity(userId: number, data: Partial<SandboxActivityRow>): Promise<SandboxActivityRow>;
export declare function getSandboxActivities(userId: number): Promise<SandboxActivityRow[]>;
export declare function getSandboxSummary(userId: number): Promise<SandboxSummary>;
export declare function recordSalesExecution(userId: number, data: Partial<SalesExecutionRow>): Promise<SalesExecutionRow>;
export declare function getSalesExecutions(userId: number): Promise<SalesExecutionRow[]>;
export declare function getLeads(status?: LeadStatus, limit?: number, offset?: number): Promise<LeadTaxonomyRow[]>;
export declare function runDedupScan(userId: number): Promise<{
    clusters: number;
    duplicates: number;
}>;
export declare function claimLead(userId: number, leadId: number): Promise<LeadClaimResult>;
export declare function getClaimedLeads(userId: number): Promise<LeadTaxonomyRow[]>;
export declare function getQualityChecks(userId: number): Promise<any[]>;
export declare function runRandomAudit(userId: number, auditorId: number): Promise<VerificationAuditRow>;
export declare function getVerificationAudits(userId: number): Promise<VerificationAuditRow[]>;
export declare function getGraduationStatus(userId: number): Promise<GraduationStatus>;
export declare function directorApproveGraduation(userId: number, directorId: number): Promise<GraduationRow>;
export declare function promoteSandboxData(userId: number, directorId: number): Promise<{
    orgsPromoted: number;
    contactsPromoted: number;
    oppsPromoted: number;
}>;
//# sourceMappingURL=academy-v2.service.d.ts.map