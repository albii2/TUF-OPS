"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISSUE_CATEGORIES = exports.ISSUE_SEVERITIES = exports.ISSUE_STATUSES = void 0;
/** Status values for Employee Issues */
exports.ISSUE_STATUSES = [
    'NEW',
    'TRIAGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'READY_FOR_VERIFICATION',
    'RESOLVED',
    'CLOSED',
];
/** Severity levels */
exports.ISSUE_SEVERITIES = ['low', 'medium', 'high', 'critical'];
/** Categories for issue classification */
exports.ISSUE_CATEGORIES = [
    'bug',
    'feature_request',
    'process_improvement',
    'tooling',
    'data_quality',
    'onboarding',
    'integration',
    'security',
    'performance',
    'ux',
    'documentation',
    'other',
];
//# sourceMappingURL=issues.interface.js.map