
import { NextPlay, CashBoard, PipelineFlow, OpsReady, OwnershipView, OwnerDashboardData } from './reporting.interface';

export const STAGE_STUCK_THRESHOLDS: { [key: string]: number } = {
    LEAD_ASSIGNED: 2,
    CONTACTED: 2,
    DISCOVERY: 3,
    MOCKUP_REQUESTED: 3,
    MOCKUP_DELIVERED: 2,
    INVOICE_SENT: 2,
    DECISION_PENDING: 2,
    default: 3,
};
