"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityChannelType = exports.OpportunityStage = void 0;
var OpportunityStage;
(function (OpportunityStage) {
    OpportunityStage["LEAD_ENGAGED"] = "LEAD_ENGAGED";
    OpportunityStage["DISCOVERY"] = "DISCOVERY";
    OpportunityStage["MOCKUP_STAGE"] = "MOCKUP_STAGE";
    OpportunityStage["INVOICE_SENT"] = "INVOICE_SENT";
    OpportunityStage["CLOSED_WON"] = "CLOSED_WON";
    OpportunityStage["CLOSED_LOST"] = "CLOSED_LOST";
    // Legacy aliases mapped for backward compatibility in database/existing queries.
    OpportunityStage["LEAD_ASSIGNED"] = "LEAD_ASSIGNED";
    OpportunityStage["CONTACTED"] = "CONTACTED";
    OpportunityStage["MOCKUP_REQUESTED"] = "MOCKUP_REQUESTED";
    OpportunityStage["MOCKUP_DELIVERED"] = "MOCKUP_DELIVERED";
    OpportunityStage["DECISION_PENDING"] = "DECISION_PENDING";
    // Legacy aliases retained for backward compatibility in tests/older callers.
    OpportunityStage["NOT_STARTED"] = "LEAD_ASSIGNED";
    OpportunityStage["CONTACT_INITIATED"] = "CONTACTED";
    OpportunityStage["MOCKUP_IN_PROGRESS"] = "MOCKUP_REQUESTED";
    OpportunityStage["MOCKUP_APPROVED"] = "MOCKUP_DELIVERED";
    OpportunityStage["SAMPLE_REQUESTED"] = "INVOICE_SENT";
    OpportunityStage["SAMPLE_IN_PRODUCTION"] = "DECISION_PENDING";
    OpportunityStage["SAMPLE_APPROVED"] = "DECISION_PENDING";
    OpportunityStage["PAYMENT_RECEIVED"] = "DECISION_PENDING";
})(OpportunityStage || (exports.OpportunityStage = OpportunityStage = {}));
var OpportunityChannelType;
(function (OpportunityChannelType) {
    OpportunityChannelType["UNIFORM"] = "UNIFORM";
    OpportunityChannelType["TRAVEL_GEAR"] = "TRAVEL_GEAR";
    OpportunityChannelType["TEAM_STORE"] = "TEAM_STORE";
    OpportunityChannelType["LETTERMAN"] = "LETTERMAN";
})(OpportunityChannelType || (exports.OpportunityChannelType = OpportunityChannelType = {}));
//# sourceMappingURL=opportunities.interface.js.map