
import { NextPlay, CashBoard, PipelineFlow, OpsReady, OwnershipView, OwnerDashboardData } from './reporting.interface';

export const STAGE_STUCK_THRESHOLDS: { [key: string]: number } = {
    LEAD_ASSIGNED: 2,
    CONTACT_INITIATED: 2,
    MOCKUP_IN_PROGRESS: 3,
    MOCKUP_APPROVED: 2,
    SAMPLE_REQUESTED: 2,
    SAMPLE_IN_PRODUCTION: 5,
    SAMPLE_APPROVED: 2,
    INVOICE_SENT: 2,
    PAYMENT_RECEIVED: 1,
    default: 3,
};
