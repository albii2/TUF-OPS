"use strict";
// ─── Academy v2 — Evidence-Based Certification ───
// Interfaces for the new TUF Academy certification system
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHASE_3_MISSIONS = exports.AcademyPhase = exports.DirectorReviewStatus = exports.AcademyMissionStatus = void 0;
var AcademyMissionStatus;
(function (AcademyMissionStatus) {
    AcademyMissionStatus["LOCKED"] = "locked";
    AcademyMissionStatus["AVAILABLE"] = "available";
    AcademyMissionStatus["IN_PROGRESS"] = "in_progress";
    AcademyMissionStatus["SUBMITTED"] = "submitted";
    AcademyMissionStatus["APPROVED"] = "approved";
    AcademyMissionStatus["REJECTED"] = "rejected";
})(AcademyMissionStatus || (exports.AcademyMissionStatus = AcademyMissionStatus = {}));
var DirectorReviewStatus;
(function (DirectorReviewStatus) {
    DirectorReviewStatus["PENDING"] = "pending";
    DirectorReviewStatus["APPROVED"] = "approved";
    DirectorReviewStatus["REJECTED"] = "rejected";
})(DirectorReviewStatus || (exports.DirectorReviewStatus = DirectorReviewStatus = {}));
var AcademyPhase;
(function (AcademyPhase) {
    AcademyPhase["PHASE_1_FOUNDATIONS"] = "phase_1";
    AcademyPhase["PHASE_2_CRM"] = "phase_2";
    AcademyPhase["PHASE_3_TERRITORY"] = "phase_3";
})(AcademyPhase || (exports.AcademyPhase = AcademyPhase = {}));
exports.PHASE_3_MISSIONS = [
    {
        mission_number: 1,
        title: 'Find 5 Schools',
        description: 'Research enrollment, sports, AD, coaches, existing provider. Create organizations.',
        instructions: `Research 5 high schools in your territory. For each school:
1. Find enrollment numbers
2. List all sports programs offered
3. Identify the Athletic Director
4. List head coaches (Football, Volleyball at minimum)
5. Identify their current uniform/apparel provider
6. Create the organization in TUF Ops with all details`,
        requiredActions: ['Create 5 organizations', 'Add enrollment data', 'Add sports programs', 'Note current provider'],
    },
    {
        mission_number: 2,
        title: 'Create Contacts',
        description: 'Create contacts (Principal, AD, Football Coach, Volleyball Coach, Activities Director) for each org.',
        instructions: `For each of your 5 organizations, create contacts:
• Principal
• Athletic Director
• Football Coach
• Volleyball Coach
• Activities Director

Add email, phone, and any notes from your research. These are real people at real schools.`,
        requiredActions: ['Create 15-20 contacts across 5 orgs', 'Add emails and phone numbers', 'Include role/title for each contact'],
    },
    {
        mission_number: 3,
        title: 'Create First Opportunity',
        description: 'Create first real opportunity with estimated value, close date, lane, stage.',
        instructions: `Create your first real opportunity. Select one of your organizations and one sport.

Required fields:
• Organization and sport
• Lane (Uniforms, Travel Gear, Team Store, Letterman)
• Stage (LEAD → LEAD_ENGAGED minimum)
• Estimated value
• Target close date
• Notes about the program's needs
• Next action with date`,
        requiredActions: ['Create 5 opportunities', 'Set estimated value on each', 'Set stage on each', 'Add notes on each', 'Set next action with date'],
    },
    {
        mission_number: 4,
        title: 'Schedule First Outreach',
        description: 'Schedule first outreach (phone/email/visit), log activity.',
        instructions: `Schedule and log your first outreach activities:
• Phone calls to your contacts
• Emails introducing TUF
• Planned school visits

Log every activity in TUF Ops. Each activity should include:
• Type (call, email, meeting, visit)
• Date/time
• Notes about the conversation or plan
• Linked to the correct opportunity or organization`,
        requiredActions: ['Log 15 activities', 'Include activity type and date', 'Link activities to orgs/opps', 'Add meaningful notes'],
    },
    {
        mission_number: 5,
        title: 'Director Review',
        description: 'Director reviews all work before advancing.',
        instructions: `Your Director will review your territory:
• All 5 organizations with complete details
• All contacts with roles and contact info
• All 5 opportunities with values, stages, and notes
• All 15 activities with dates and notes

Your Director must approve each component before you graduate.`,
        requiredActions: ['All orgs verified', 'All contacts verified', 'All opportunities verified', 'All activities verified', 'Director approval'],
    },
];
//# sourceMappingURL=academy.interface.js.map