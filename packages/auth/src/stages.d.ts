export declare const STAGES: {
    readonly LEAD: "lead";
    readonly CONTACTED: "contacted";
    readonly PROPOSAL_SENT: "proposal_sent";
    readonly NEGOTIATION: "negotiation";
    readonly ORDER_ASSEMBLY: "order_assembly";
    readonly DIRECTOR_QA: "director_qa";
    readonly CLOSED_WON: "closed_won";
    readonly READY_FOR_OPS: "ready_for_operations";
    readonly IN_PRODUCTION: "in_production";
    readonly QUALITY_CONTROL: "quality_control";
    readonly SHIPPED: "shipped";
    readonly DELIVERED: "delivered";
    readonly CLOSED_LOST: "closed_lost";
};
export type Stage = typeof STAGES[keyof typeof STAGES];
export declare const VALID_TRANSITIONS: Record<Stage, Stage[]>;
export declare const SALES_STAGES: Stage[];
export declare const FULFILLMENT_STAGES: Stage[];
export declare function isValidTransition(from: Stage, to: Stage): boolean;
export declare function isSalesStage(stage: Stage): boolean;
export declare function isFulfillmentStage(stage: Stage): boolean;
/** Normalize any stage string to lowercase for comparison (handles legacy uppercase values). */
export declare function normalizeStage(stage: string): string;
//# sourceMappingURL=stages.d.ts.map