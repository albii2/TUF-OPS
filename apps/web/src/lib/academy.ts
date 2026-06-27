/**
 * TUF Academy — Module definitions, quizzes, Learn→Demonstrate→Coach Review→Deploy flow,
 * Director feedback loop, and "Level 1 Certified Territory Account Executive" title.
 *
 * Governing specs:
 *   docs/canon/SOS_v1.0.md Section 2.3 (Sales Philosophy)
 *   docs/canon/Academy_v1.0.md
 *
 * MODULE STRUCTURE:
 *   ACAD-101: The TUF Philosophy
 *   ACAD-102: Prospecting
 *   ACAD-103: Discovery
 *   ACAD-104: Proposal
 *   ACAD-105: Order Handoff
 *
 * PHASES PER MODULE:
 *   LEARN → DEMONSTRATE → COACH REVIEW → DEPLOY
 */

import { listOrganizations } from '../services/organizationsService';
import { listOpportunities } from '../services/opportunitiesService';
import { listActivities } from '../services/activitiesService';
import { getStoredUser } from '../auth';

// ─── Module Definitions ─────────────────────────────────────────────────────

export type AcademyModuleCode = 'ACAD-101' | 'ACAD-102' | 'ACAD-103' | 'ACAD-104' | 'ACAD-105';

/**
 * Module phases reflecting the Learn → Demonstrate → Coach Review → Deploy flow.
 *
 * locked          — Previous module not yet acknowledged; cannot start.
 * learn           — Available to study and take the quiz.
 * quiz_passed     — Quiz passed; now move to Demonstrate.
 * demonstrate     — Rep performs real work (auto-detected); exercise in progress.
 * awaiting_coach  — Exercise complete; waiting for Director to provide Coach Review.
 * coach_review    — Director has provided feedback; rep must ACKNOWLEDGE.
 * acknowledged    — Rep acknowledged Coach Review; module complete. Next module unlocks.
 * certified       — All modules acknowledged → DEPLOY → Level 1 Certified TAE.
 */
export type ModulePhase =
  | 'locked'
  | 'learn'
  | 'quiz_passed'
  | 'demonstrate'
  | 'awaiting_coach'
  | 'coach_review'
  | 'acknowledged'
  | 'certified';

export interface CoachReview {
  /** What the rep did well */
  strengths: string;
  /** What needs improvement */
  corrections: string;
  /** General coaching guidance */
  coachingNotes: string;
  /** Director name who provided the review */
  reviewedBy: string;
  /** ISO date string */
  reviewedAt: string;
}

export interface ModuleProgress {
  code: AcademyModuleCode;
  phase: ModulePhase;
  currentValue: number;
  targetValue: number;
  label: string;
  /** Additional context like stages used count */
  extra?: string;
  /** Director feedback (only set after Coach Review phase) */
  coachReview?: CoachReview;
  /** ISO date when the rep acknowledged the Coach Review */
  acknowledgedAt?: string;
}

export interface AcademyModule {
  code: AcademyModuleCode;
  name: string;
  description: string;
  completionCriteria: string;
  /** What the rep must do in the Demonstrate phase */
  demonstrateTask: string;
  /** The SOS Sales Philosophy principle this module reinforces */
  philosophyPrinciple: number;
  /** Learning content for the Learn phase */
  learnContent: LearnContent[];
}

export interface LearnContent {
  heading: string;
  body: string;
}

/** Level 1 — TUF Sales System modules */
export const LEVEL_1_MODULES: AcademyModule[] = [
  {
    code: 'ACAD-101',
    name: 'The TUF Philosophy',
    description:
      'Why TUF exists, the mission, sales expectations, the four-order baseline, lane penetration, and the 7 Sales Philosophy principles.',
    completionCriteria:
      'Write a paragraph explaining TUF’s mission in your own words, reviewed by your Director.',
    demonstrateTask:
      'Write a paragraph explaining TUF’s mission in your own words and submit it for Director review.',
    philosophyPrinciple: 1, // We sell trust before apparel
    learnContent: [
      {
        heading: 'Why TUF Exists',
        body: 'Coaches invest hundreds of hours into their athletes every season. They should not spend a single hour chasing uniform vendors, verifying artwork, fixing sizing errors, or tracking shipments. TUF exists to absorb that burden. The product is custom team uniforms. The value proposition is peace of mind.',
      },
      {
        heading: 'The Four-Order Baseline',
        body: 'TUF targets four healthy orders per month, every month. Consistency over size. Four consistent orders beat one lucky whale. This baseline keeps your pipeline healthy and your activity consistent.',
      },
      {
        heading: 'The Four Revenue Lanes',
        body: 'TUF operates four fixed revenue lanes — not product categories. Every sport fits into these four lanes.\n\nUnderstanding this is the foundation of TUF economics:\n\n1. Uniforms\n   Game-day kits, jerseys, pants, shorts, practice wear.\n\n2. Travel Gear\n   Bags, warm-ups, hoodies, jackets, team travel apparel.\n\n3. Team Stores\n   Online storefront where parents and fans buy spirit wear.\n\n4. Letterman Jackets\n   Varsity jackets, senior awards, achievement gear.\n\nThese are NOT products.\n\nA football jersey is a product within the Uniforms lane. A hoodie is a product within the Travel Gear lane.\n\nThe lanes are the revenue streams — the products are what you sell within each lane.',
      },
      {
        heading: 'Revenue Opportunities — The TUF Economics',
        body: 'Every sport inside an athletic department creates four core revenue opportunities for TUF:\n\n• Uniforms\n• Travel Gear\n• Team Stores\n• Letterman Jackets\n\nA Revenue Opportunity = one sport × one lane.\n\nExample:\nFootball has 4 revenue opportunities.\nA school with 12 sports has 48 total (12 × 4).\n\nYour job is to develop all four opportunities within every sport you manage.\n\nThis is why TUF measures lane penetration — not just total sales.',
      },
      {
        heading: 'Understanding Account Penetration',
        body: 'Account Penetration is the percentage of revenue opportunities you have won within an account.\n\nIt is the single most important number for a TUF rep.\n\nExample — Spring Lake Park High School:\n\nFootball\n  ✓ Uniforms   ✗ Travel Gear   ✗ Team Store   ✗ Letterman Jackets\n\nBasketball\n  ✓ Uniforms   ✓ Travel Gear   ✗ Team Store   ✗ Letterman Jackets\n\nBaseball\n  ✗ Uniforms   ✗ Travel Gear   ✗ Team Store   ✗ Letterman Jackets\n\n...across all 12 sports...\n\nOverall: 11 / 48 Revenue Opportunities = 23%\n\nNow you instantly understand what success looks like.\n\nYour job is to increase that percentage — sport by sport, lane by lane.\n\nA rep at 23% penetration has 37 untapped opportunities inside an account they already have a relationship with.\n\nThat is TUF economics.',
      },
      {
        heading: 'Standard TUF Terminology',
        body: 'Use this vocabulary consistently. It becomes the operating language of your territory:\n\nAccount\n  School, club, or organization.\n\nSport\n  Football, Baseball, Volleyball, etc.\n\nLane\n  One of the four recurring revenue streams.\n  Uniforms, Travel Gear, Team Stores, Letterman Jackets.\n\nRevenue Opportunity\n  One sport × one lane.\n\nAccount Penetration\n  Revenue opportunities won ÷ total revenue opportunities.\n\nTerritory Penetration\n  Combined penetration across every assigned account.\n\nThis vocabulary is durable.\n\nEveryone — TAEs, Directors, executives — knows exactly what "we\'re at 42% penetration in this account" means without discussing individual products.',
      },
      {
        heading: 'The 7 Sales Philosophy Principles',
        body: 'The Sales Philosophy is the DNA of every TUF rep. It governs how we sell, not just what we sell. Memorize these seven principles — they will be referenced in every module.',
      },
      {
        heading: 'Your Mission as a TUF Rep',
        body: 'Your mission is to become the trusted apparel partner for athletic programs in your territory. Every coach who trusts their TUF rep is a program that will not shop competitors. You are not selling uniforms — you are selling confidence that their team will look right, on time, with zero hassle.',
      },
    ],
  },
  {
    code: 'ACAD-102',
    name: 'Prospecting',
    description:
      'How to identify programs, research, make first contact, and qualify. Territory awareness and activity mindset.',
    completionCriteria:
      'Create 5+ organizations, log 3+ prospecting activities, and build one week’s pipeline.',
    demonstrateTask:
      'Add 5 organizations, log 3 prospecting activities, and build one week’s pipeline.',
    philosophyPrinciple: 5, // Activity creates opportunity
    learnContent: [
      {
        heading: 'Identifying Programs',
        body: 'A program is any athletic team, club, or school department that buys uniforms or apparel. Start with high schools in your territory — football, basketball, baseball, softball, soccer, volleyball, track, cheer, band. Then expand to middle schools, youth leagues, and club teams.',
      },
      {
        heading: 'Research First, Contact Second',
        body: 'Before making contact, research the program: what sports do they offer? What do their current uniforms look like? When is their season? Who is the head coach or athletic director? An informed first contact is 10x more effective than a cold call.',
      },
      {
        heading: 'Making First Contact',
        body: 'Your first contact should be personal and specific. Reference their program by name. Mention something you noticed about their current look. Ask about their upcoming season. The goal is a conversation, not a sale — not yet.',
      },
      {
        heading: 'Qualifying Programs',
        body: 'Not every program is ready to buy today. Qualify by timeline (when do they need new uniforms?), budget (do they have funding?), and authority (are you talking to the decision-maker?). A qualified lead is one where all three are known.',
      },
      {
        heading: 'Activity Mindset',
        body: 'Activity creates opportunity. Your pipeline is built through calls, visits, follow-ups. Measure activity first. The target is consistent daily outreach — not one big push before month-end.',
      },
    ],
  },
  {
    code: 'ACAD-103',
    name: 'Discovery',
    description:
      'How to have a discovery conversation, identify all applicable sales lanes, and record needs correctly.',
    completionCriteria:
      'Create an opportunity, identify all applicable sales lanes, and record needs correctly in the opportunity.',
    demonstrateTask:
      'Create an opportunity, identify all applicable sales lanes, and record needs correctly.',
    philosophyPrinciple: 4, // Coaches buy from people
    learnContent: [
      {
        heading: 'What Is Discovery?',
        body: 'Discovery is the conversation where you learn everything about a program’s needs — not the conversation where you pitch your product. The rep who listens most wins most. Ask open-ended questions, take detailed notes, and resist the urge to sell until you understand.',
      },
      {
        heading: 'Identifying Revenue Lanes',
        body: 'During discovery, your job is to identify which of the four revenue lanes apply to each sport in the program. The four lanes are fixed: Uniforms, Travel Gear, Team Stores, Letterman Jackets.\n\nAsk the coach about each lane explicitly:\n• "What do you currently do for game uniforms?"\n• "Do your teams travel with matching warm-ups or bags?"\n• "Do you have an online store for parents and fans?"\n• "Do you order letterman jackets or senior achievement gear?"\n\nEvery sport may have different lane penetration. Football might have uniforms and travel gear but no team store. Basketball might only have uniforms. Your discovery notes should map every sport to every lane — checked or unchecked.\n\nRemember: products live inside lanes. Don\'t ask "do you need basketball jerseys?" — ask "what does your basketball uniform program look like?" Then identify the products within that lane.',
      },
      {
        heading: 'Recording Needs Correctly',
        body: 'Document every need you uncover: sport, gender, quantity, timeline, budget, design preferences, special requirements. These notes become your proposal blueprint. If it’s not in the discovery notes, it won’t be in the proposal — and the coach will notice.',
      },
      {
        heading: 'Discovery Maps to Pipeline Stages',
        body: 'Discovery happens between Lead and Contacted stages. It’s the bridge from "we should talk" to "here’s what we need." A thorough discovery moves the opportunity from Contacted to Proposal Sent with confidence.',
      },
    ],
  },
  {
    code: 'ACAD-104',
    name: 'Proposal',
    description:
      'How to build a proposal from discovery notes, mockup process, pricing strategy, and presenting to coaches.',
    completionCriteria:
      'Advance opportunities through Contacted → Proposal Sent → Negotiation, project deal value from discovery, and prepare a package for Director review.',
    demonstrateTask:
      'Advance opportunities through the correct stages (Contacted → Proposal Sent → Negotiation), project deal value from discovery, and prepare a package.',
    philosophyPrinciple: 1, // We sell trust before apparel
    learnContent: [
      {
        heading: 'Building from Discovery',
        body: 'Your proposal is built entirely from discovery notes. Every item in the proposal should trace back to a need the coach expressed. If the coach didn’t ask for it, don’t include it — but DO mention additional lanes you identified that they might want to discuss.',
      },
      {
        heading: 'The Mockup Process',
        body: 'Before sending a formal proposal, create a mockup. Show the coach what their uniforms will look like. A visual sells faster than a spreadsheet. Use the mockup to confirm design choices, then attach it to the proposal.',
      },
      {
        heading: 'Pricing Strategy',
        body: 'Present pricing confidently — not apologetically. You are selling peace of mind, not just fabric. Bundle items where possible. Offer options at different price points. Never lead with the cheapest option — lead with the best value.',
      },
      {
        heading: 'Presenting to Coaches',
        body: 'Present the proposal in person or via video call whenever possible. Walk through each item, connect it back to their needs, and ask for feedback. A proposal sent without a conversation is a proposal ignored. The goal is a "yes" — or a clear "not yet" with next steps.',
      },
      {
        heading: 'Handling Objections',
        body: 'Objections are buying signals. "It\'s too expensive" means they haven\'t seen the value yet. "We need to think about it" means there\'s an unanswered question. Dig into every objection — it\'s your path to closing.',
      },
    ],
  },
  {
    code: 'ACAD-105',
    name: 'Order Handoff',
    description:
      'The Closed Won standard, what Operations needs (roster, sizing, artwork, payment), and the Director QA question.',
    completionCriteria:
      'Reach Closed Won correctly, complete all required information, and successfully hand off to Operations.',
    demonstrateTask:
      'Reach Closed Won, complete all required information (roster, sizing, artwork, payment), and hand off to Operations.',
    philosophyPrinciple: 7, // The Director QA question
    learnContent: [
      {
        heading: 'The Closed Won Standard',
        body: 'A deal is NOT Closed Won just because the coach said yes. A deal is Closed Won when: payment is collected, roster is received, sizing is confirmed, artwork is approved, and the Director answers "yes" to the QA question. Until all five are true, the deal stays in Order Assembly.',
      },
      {
        heading: 'What Operations Needs',
        body: 'Operations needs four things to fulfill an order without contacting the customer: (1) Final roster with names and numbers, (2) Complete sizing for every athlete, (3) Approved artwork files, (4) Payment confirmation. If any of these are missing, the handoff is incomplete.',
      },
      {
        heading: 'The Director QA Question',
        body: '"Can Operations produce this order without contacting the customer again?" If the answer is NO, the deal is not ready. Go back and fill the gaps. This single question is TUF\'s quality standard — it protects the customer, Operations, and your reputation.',
      },
      {
        heading: 'Who Owns What After Closed Won',
        body: 'After Closed Won, Operations owns fulfillment — from vendor submission through delivery. You own the relationship — post-delivery contact, testimonial collection, and renewal planning. Sales acquires. Operations fulfills. The wall between them is a feature, not a bug.',
      },
    ],
  },
];

// ─── Module Order (sequential gating) ────────────────────────────────────────

export const MODULE_ORDER: AcademyModuleCode[] = [
  'ACAD-101',
  'ACAD-102',
  'ACAD-103',
  'ACAD-104',
  'ACAD-105',
];

// ─── Sales Philosophy ────────────────────────────────────────────────────────

export interface PhilosophyPrinciple {
  number: number;
  title: string;
  meaning: string;
}

/** The 7 Sales Philosophy principles per SOS_v1.0 Section 2.3 */
export const SALES_PHILOSOPHY: PhilosophyPrinciple[] = [
  {
    number: 1,
    title: 'We sell trust before apparel.',
    meaning: 'A coach buys confidence that their team will look right, on time, with zero hassle.',
  },
  {
    number: 2,
    title: 'Relationships compound.',
    meaning: "Every closed deal feeds the next one. Short-term deals don't build a strong pipeline — relationships do.",
  },
  {
    number: 3,
    title: 'Four healthy orders beat one lucky order.',
    meaning: 'Consistency over size. The target is four per month, every month.',
  },
  {
    number: 4,
    title: 'Coaches buy from people.',
    meaning: 'They buy from someone who understands their program. The rep IS the product.',
  },
  {
    number: 5,
    title: 'Activity creates opportunity.',
    meaning: 'Pipeline is built through calls, visits, follow-ups. Measure activity first.',
  },
  {
    number: 6,
    title: 'Pipeline predicts success.',
    meaning: "Your pipeline tells you what's coming. Last quarter tells you what already happened. Focus on what you're building today.",
  },
  {
    number: 7,
    title: 'The Director QA question.',
    meaning: '"Can Operations produce this order without contacting the customer again?" If no, the deal isn\'t ready.',
  },
];

// ─── Quiz Definitions ────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  moduleCode: AcademyModuleCode;
  score: number; // 0–100
  passed: boolean; // ≥ 80%
  attempts: number;
  lastAttempt: string; // ISO date
}

export const QUIZ_PASS_THRESHOLD = 80;

/**
 * Quiz questions per module (5 questions each).
 *
 * Design principles:
 * - At least 1 scenario-based question per module (tests judgment, not memory).
 * - At least 1 Sales Philosophy question per module (tests WHY, not just what).
 * - Distractors must be plausible — things a new rep might actually believe.
 * - Every answer is definitively findable in the module's learnContent.
 * - No "all of the above" shortcuts.
 * - Correct answer should not be obvious by length.
 */
export const QUIZZES: Record<AcademyModuleCode, QuizQuestion[]> = {
  'ACAD-101': [
    {
      id: '101-q1',
      question: 'Why does TUF exist?',
      options: [
        'To absorb the uniform/apparel burden so coaches can focus on their athletes',
        'To manufacture the cheapest team uniforms available',
        'To outsource athletic department purchasing to a central procurement vendor',
        'To compete with national retailers by offering more style and color options',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q2',
      question: 'What is the four-order baseline?',
      options: [
        'The target of four healthy orders per month, every month — consistency over size',
        'A minimum of four quotes per week to maintain pipeline velocity',
        'Four orders is the maximum any rep can effectively manage at one time',
        'Only the four largest programs in a territory generate meaningful revenue',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q3',
      question: 'A rep reviews their account and finds they have won 11 out of 48 total revenue opportunities — 23% account penetration. What does this tell them?',
      options: [
        'There are 37 untapped revenue opportunities inside an account they already have a relationship with',
        'The account is underperforming below the minimum threshold and should be deprioritized',
        'They have already captured the majority of available revenue in that account',
        'The account only needs uniforms — travel gear and team stores are not relevant here',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q4',
      question: 'A coach is comparing TUF\'s price to a cheaper online vendor. Based on Sales Philosophy Principle #1 ("We sell trust before apparel"), what is the most effective response?',
      options: [
        'Explain that TUF sells confidence the team will look right, on time, with zero hassle — which a discount vendor cannot guarantee',
        'Offer to match the competitor\'s price to secure the business and prove TUF\'s value later',
        'Tell the coach that higher price always means higher quality in team uniforms',
        'Ask the coach to share the competitor\'s quote so TUF can undercut it by 5%',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q5',
      question: 'A rep has been selling football uniforms to Jefferson High for two years but has never discussed team stores, travel gear, or letterman jackets. The rep considers the account "fully developed." What is wrong with this assessment?',
      options: [
        'The rep has only penetrated the Uniforms lane in one sport — three additional lanes and multiple other sports remain untapped',
        'Two years of relationship-building is not enough time to fully develop any high school account',
        'The rep should focus on finding new accounts instead of trying to expand within existing ones',
        'Nothing — uniform sales are the most important lane, so this account is fully developed',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-102': [
    {
      id: '102-q1',
      question: 'What is the first step when you identify a new program in your territory?',
      options: [
        'Research the program — learn their sports, current uniforms, season timing, and key contacts before reaching out',
        'Send a proposal with standard pricing so they have something to review immediately',
        'Call the athletic director and ask for an order on the first conversation',
        'Wait for the program to post an RFP or reach out to TUF directly',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q2',
      question: 'The learning content states "Activity creates opportunity." What does this mean for how a TAE should structure their week?',
      options: [
        'Consistent daily outreach — not one big push before month-end',
        'All prospecting should be done on Monday so the rest of the week is free for follow-up',
        'Only prospect when the pipeline drops below four active deals',
        'Make as many calls as possible on the last day of the month to hit targets',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q3',
      question: 'A TAE discovers a high school in their territory with 14 sports. Their research shows the football uniforms are five years old and the basketball team wears mismatched warm-ups. What should the TAE do next?',
      options: [
        'Make personal contact — reference the program by name, mention what they noticed about the current uniforms, and ask about the upcoming season',
        'Build a full proposal covering new football and basketball uniforms with pricing and mockups',
        'Wait for the athletic director to post an RFP since the uniforms are clearly due for replacement',
        'Call the football coach directly and ask if they want to place a uniform order this week',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q4',
      question: 'What three things should you verify when qualifying a program?',
      options: [
        'Timeline, budget, and authority (are you talking to the decision-maker?)',
        'School name, athletic director email, and team colors',
        'Number of sports, number of athletes per sport, and current uniform brand',
        'Website URL, social media presence, and booster club contact',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q5',
      question: 'Sales Philosophy #6 states "Pipeline predicts success." During the prospecting phase, what should a TAE focus on measuring?',
      options: [
        'The number of programs contacted and qualified today — building pipeline predicts tomorrow\'s revenue',
        'Last quarter\'s closed revenue to determine whether additional prospecting is needed',
        'How many proposals were sent last month across the entire territory',
        'The total dollar value of the single largest deal currently in negotiation',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-103': [
    {
      id: '103-q1',
      question: 'What are the four TUF revenue lanes?',
      options: [
        'Uniforms, Travel Gear, Team Stores, Letterman Jackets — the four recurring revenue streams every sport generates',
        'Geographic territories assigned to each rep for account management',
        'The sequential stages in the TUF sales pipeline',
        'Different pricing tiers offered for uniform packages',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q2',
      question: 'Why must you record needs in detail during discovery?',
      options: [
        'Discovery notes become the proposal blueprint — if a need is not in the notes, it will not be in the proposal, and the coach will notice',
        'Recording needs is optional since the proposal can be built from memory of the conversation',
        'Needs are only recorded for the Operations team — they are not used when building proposals',
        'The coach is expected to email a written list of all needs within 48 hours of the discovery call',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q3',
      question: 'Where in the pipeline does discovery take place?',
      options: [
        'Between Lead and Contacted — discovery is the bridge from "we should talk" to "here\'s what we need"',
        'Between Contacted and Proposal Sent — you must make contact first, then discover needs',
        'During the Lead stage — all discovery research happens before making any contact',
        'After Proposal Sent — discovery continues as the coach reviews the proposal and clarifies needs',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q4',
      question: 'During discovery, a coach says they only want to discuss football game uniforms. According to Sales Philosophy #4 ("Coaches buy from people"), why should the rep still ask about travel gear, team stores, and letterman jackets?',
      options: [
        'Because understanding the full program shows the coach you care about their entire athletic department — not just one transaction',
        'Because the rep\'s commission structure requires all four lanes to be discussed on every call',
        'Because TUF company policy mandates that every discovery conversation cover all four lanes',
        'Because coaches are legally required to evaluate all uniform and apparel options each season',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q5',
      question: 'A TAE is in a discovery meeting with an athletic director who says "We\'re happy with our current uniform vendor — have been for eight years." What should the TAE do?',
      options: [
        'Ask open-ended questions about their program\'s specific needs — discovery is about listening and understanding, not pitching',
        'Offer a 15% first-year discount to incentivize switching vendors immediately',
        'Thank them for their time, note the account as unqualified, and move to the next school',
        'Explain in detail why TUF uniforms are superior in quality to their current vendor\'s products',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-104': [
    {
      id: '104-q1',
      question: 'What must be complete before sending a proposal to a coach?',
      options: [
        'Discovery notes — every item in the proposal should trace back to a specific need the coach expressed',
        'The deal must already be at Closed Won stage before a formal proposal can be sent',
        'Payment must be collected and processed before the proposal is delivered',
        'The Operations team must review and approve the proposal before it reaches the coach',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q2',
      question: 'A coach says "This is more expensive than we expected." How should you handle this objection?',
      options: [
        'Dig into the objection — it is a buying signal and your path to understanding what value the coach has not yet seen',
        'Immediately reduce the price by 20% to keep the conversation moving forward',
        'Explain that TUF pricing is non-negotiable and ask if they want to proceed anyway',
        'Acknowledge the concern and offer to rebuild the proposal using the cheapest options only',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q3',
      question: 'A coach receives a proposal, reviews it, and says "We need to think about it." Based on the Proposal module, what does this response most likely indicate?',
      options: [
        'There is an unanswered question holding them back — dig in to uncover what it is',
        'The coach needs to get budget approval from the school board and will follow up later',
        'The proposal was too expensive and should be scrapped in favor of a lower-priced option',
        'The coach is politely declining and the rep should redirect effort to other programs',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q4',
      question: 'What are the correct pipeline stages for advancing an opportunity toward a deal?',
      options: [
        'Contacted → Proposal Sent → Negotiation',
        'Lead → Proposal Sent → Closed Won',
        'Discovery → Invoice Sent → Shipped',
        'Contacted → Mockup Approved → Delivered',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q5',
      question: 'A coach is skeptical about committing to TUF because a previous vendor delayed their order by three weeks last season. How should the TAE apply Sales Philosophy #1 ("We sell trust before apparel") in this situation?',
      options: [
        'Emphasize TUF\'s peace-of-mind promise — the team will look right, on time, with zero hassle — and explain the Operations handoff process that ensures reliability',
        'Offer a 10% discount to compensate the coach for their previous vendor\'s poor performance',
        'Promise to personally expedite production and guarantee delivery two weeks ahead of schedule',
        'Explain that TUF uses different manufacturers than most competitors, so delays are unlikely',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-105': [
    {
      id: '105-q1',
      question: 'What is the Director QA question?',
      options: [
        '"Can Operations produce this order without contacting the customer again?"',
        '"Did the rep meet their monthly quota target for this deal?"',
        '"Is the proposal formatted according to TUF brand guidelines?"',
        '"Has the coach signed and returned the purchase agreement?"',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q2',
      question: 'When is a deal truly Closed Won?',
      options: [
        'When payment is collected, roster received, sizing confirmed, artwork approved, AND the Director answers "yes" to the QA question',
        'As soon as the coach gives a verbal "yes" during the proposal presentation',
        'When the proposal is sent and the coach acknowledges receipt via email',
        'When the Operations team begins processing the order in the system',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q3',
      question: 'Who owns fulfillment after a deal reaches Closed Won?',
      options: [
        'Operations — from vendor submission through final delivery to the customer',
        'The TAE — they stay involved in production to ensure the customer is satisfied',
        'The Sales Director — they personally manage all post-close fulfillment',
        'The coach — they coordinate directly with the manufacturer on timelines',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q4',
      question: 'What four things must Operations receive before they can fulfill an order without contacting the customer?',
      options: [
        'Final roster, complete sizing, approved artwork, and payment confirmation',
        'Signed proposal, purchase order, coach contact info, and delivery address',
        'Coach name, sport type, team colors, and requested delivery date',
        'Mockup approval, initial quote, vendor PO number, and coach email',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q5',
      question: 'A TAE gets a verbal "yes" from a coach for a $12,000 football uniform order. The coach says "Send the invoice and we\'ll get it paid next week." The TAE immediately marks the deal Closed Won. What is wrong?',
      options: [
        'The deal is not Closed Won — payment, roster, sizing, and artwork must all be finalized, and the Director must answer "yes" to the QA question',
        'Nothing is wrong — a verbal commitment and intent to pay is sufficient to close the deal',
        'The deal should be moved to Negotiation, not Closed Won, because the invoice has not been paid',
        'The TAE should have collected payment during the call before changing the stage',
      ],
      correctIndex: 0,
    },
  ],
};

// ─── Quiz Storage ────────────────────────────────────────────────────────────

const QUIZ_RESULTS_KEY = 'tuf_academy_quiz_results';

export function getQuizResults(): Partial<Record<AcademyModuleCode, QuizResult>> {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<AcademyModuleCode, QuizResult>>;
  } catch {
    return {};
  }
}

export function getQuizResult(code: AcademyModuleCode): QuizResult | null {
  const results = getQuizResults();
  return results[code] ?? null;
}

export function saveQuizResult(result: QuizResult): void {
  try {
    const results = getQuizResults();
    results[result.moduleCode] = result;
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
  } catch {
    // fail silently
  }
}

export function isQuizPassed(code: AcademyModuleCode): boolean {
  return getQuizResult(code)?.passed === true;
}

/**
 * Grade a quiz submission and save the result.
 */
export function gradeQuiz(
  code: AcademyModuleCode,
  answers: number[]
): QuizResult {
  const questions = QUIZZES[code];
  const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;

  const existing = getQuizResult(code);
  const attempts = (existing?.attempts ?? 0) + 1;

  const result: QuizResult = {
    moduleCode: code,
    score,
    passed,
    attempts,
    lastAttempt: new Date().toISOString(),
  };

  saveQuizResult(result);
  return result;
}

// ─── Mission Statement Storage (ACAD-101 Demonstrate) ────────────────────────

const MISSION_KEY = 'tuf_academy_mission_statement';

export function getMissionStatement(userId: string): string {
  try {
    const raw = localStorage.getItem(MISSION_KEY);
    if (!raw) return '';
    const data = JSON.parse(raw) as Record<string, string>;
    return data[userId] ?? '';
  } catch {
    return '';
  }
}

export function saveMissionStatement(userId: string, text: string): void {
  try {
    const raw = localStorage.getItem(MISSION_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    data[userId] = text;
    localStorage.setItem(MISSION_KEY, JSON.stringify(data));
  } catch {
    // fail silently
  }
}

export function hasMissionStatement(userId: string): boolean {
  return getMissionStatement(userId).trim().length > 0;
}

// ─── Coach Review Storage ────────────────────────────────────────────────────

const COACH_REVIEWS_KEY = 'tuf_academy_coach_reviews';

export function getCoachReviews(): Partial<Record<AcademyModuleCode, CoachReview>> {
  try {
    const raw = localStorage.getItem(COACH_REVIEWS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<AcademyModuleCode, CoachReview>>;
  } catch {
    return {};
  }
}

export function getCoachReview(code: AcademyModuleCode): CoachReview | null {
  const reviews = getCoachReviews();
  return reviews[code] ?? null;
}

export function saveCoachReview(code: AcademyModuleCode, review: CoachReview): void {
  try {
    const reviews = getCoachReviews();
    reviews[code] = review;
    localStorage.setItem(COACH_REVIEWS_KEY, JSON.stringify(reviews));
  } catch {
    // fail silently
  }
}

// ─── Acknowledgment Storage ──────────────────────────────────────────────────

const ACKNOWLEDGMENTS_KEY = 'tuf_academy_acknowledgments';

export function getAcknowledgments(userId: string): Set<AcademyModuleCode> {
  try {
    const raw = localStorage.getItem(ACKNOWLEDGMENTS_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as Record<string, string[]>;
    return new Set(data[userId] ?? []) as Set<AcademyModuleCode>;
  } catch {
    return new Set();
  }
}

export function isModuleAcknowledged(userId: string, code: AcademyModuleCode): boolean {
  return getAcknowledgments(userId).has(code);
}

export function acknowledgeModule(userId: string, code: AcademyModuleCode): void {
  try {
    const raw = localStorage.getItem(ACKNOWLEDGMENTS_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const acked = new Set(data[userId] ?? []);
    acked.add(code);
    data[userId] = [...acked];
    localStorage.setItem(ACKNOWLEDGMENTS_KEY, JSON.stringify(data));
  } catch {
    // fail silently
  }
}

// ─── Auto-Detection Logic ────────────────────────────────────────────────────

const ACTIVE_STAGES = new Set([
  'Lead',
  'Contacted',
  'Proposal Sent',
  'Negotiation',
  'Order Assembly',
  'Director QA',
  'Closed Won',
]);

/**
 * ACAD-101: Demonstrate — Rep writes a paragraph explaining TUF's mission.
 * Detection: checks if the mission statement has been saved.
 */
export function detectAcad101(userId: string): { completed: boolean; currentValue: number } {
  const written = hasMissionStatement(userId);
  return { completed: written, currentValue: written ? 1 : 0 };
}

/**
 * ACAD-102: Demonstrate — Add 5 organizations, log 3 prospecting activities.
 */
export function detectAcad102(): {
  completed: boolean;
  currentValue: number;
  orgCount: number;
  activityCount: number;
} {
  const orgs = listOrganizations({});
  const validOrgs = orgs.filter((o) => o.name && o.name.trim().length > 0);

  const user = getStoredUser();
  const activities = listActivities({});
  const repActivities = user
    ? activities.filter((a) => a.user === user.name)
    : activities;

  const orgCount = Math.min(validOrgs.length, 5);
  const actCount = Math.min(repActivities.length, 3);
  const combined = orgCount + actCount;

  return {
    completed: validOrgs.length >= 5 && repActivities.length >= 3,
    currentValue: combined,
    orgCount: validOrgs.length,
    activityCount: repActivities.length,
  };
}

/**
 * ACAD-103: Demonstrate — Create an opportunity, identify all sales lanes, record needs.
 * Detection: checks for opportunities with description/notes populated.
 */
export function detectAcad103(): {
  completed: boolean;
  currentValue: number;
  oppCount: number;
  oppsWithNeeds: number;
} {
  const user = getStoredUser();
  const opportunities = listOpportunities({});
  const repOpps = user
    ? opportunities.filter((o) => o.assignedRep === user.name)
    : opportunities;

  // An opportunity with needs has a non-empty description or notes
  const oppsWithNeeds = repOpps.filter(
    (o) =>
      (o.nextAction && o.nextAction.trim().length > 0)
  );

  return {
    completed: oppsWithNeeds.length >= 1,
    currentValue: oppsWithNeeds.length,
    oppCount: repOpps.length,
    oppsWithNeeds: oppsWithNeeds.length,
  };
}

/**
 * ACAD-104: Demonstrate — Advance through stages (Contacted → Proposal Sent → Negotiation),
 * project deal value from discovery.
 * Detection: checks for opportunities at Proposal Sent or Negotiation with revenue > 0.
 */
export function detectAcad104(): {
  completed: boolean;
  currentValue: number;
  proposalOpps: number;
} {
  const user = getStoredUser();
  const opportunities = listOpportunities({});
  const repOpps = user
    ? opportunities.filter((o) => o.assignedRep === user.name)
    : opportunities;

  const proposalStages = new Set(['Proposal Sent', 'Negotiation']);
  const proposalOpps = repOpps.filter(
    (o) => proposalStages.has(o.stage) && (o.value ?? o.estimatedValue ?? 0) > 0
  );

  return {
    completed: proposalOpps.length >= 1,
    currentValue: proposalOpps.length,
    proposalOpps: proposalOpps.length,
  };
}

/**
 * ACAD-105: Demonstrate — Reach Closed Won correctly, complete all required info.
 * Detection: checks for Closed Won opportunities that have complete data.
 */
export function detectAcad105(): {
  completed: boolean;
  currentValue: number;
  closedWonOpps: number;
} {
  const user = getStoredUser();
  const opportunities = listOpportunities({});
  const repOpps = user
    ? opportunities.filter((o) => o.assignedRep === user.name)
    : opportunities;

  const closedWon = repOpps.filter((o) => o.stage === 'CLOSED_WON');

  return {
    completed: closedWon.length >= 1,
    currentValue: closedWon.length,
    closedWonOpps: closedWon.length,
  };
}

// ─── Module Phase Computation ────────────────────────────────────────────────

/**
 * Determine the overall phase of a module given quiz result, exercise data,
 * coach review, and acknowledgment status.
 *
 * Sequential gating: module N is locked until module N-1 is acknowledged.
 */
function computeModulePhase(
  code: AcademyModuleCode,
  exerciseCompleted: boolean,
  currentValue: number,
  userId: string,
  isAllCertified: boolean
): ModulePhase {
  const idx = MODULE_ORDER.indexOf(code);

  // If the user is already fully certified, all modules show as certified
  if (isAllCertified) return 'certified';

  // Check sequential lock: ACAD-101 is always available; others require previous module quiz passed.
  // Quiz pass unlocks the next module immediately. Director review happens asynchronously
  // and does NOT block progression.
  if (idx > 0) {
    const prevCode = MODULE_ORDER[idx - 1];
    if (!isQuizPassed(prevCode)) {
      return 'locked';
    }
  }

  // Now check where this module is in its own flow
  const coachReview = getCoachReview(code);
  const acknowledged = isModuleAcknowledged(userId, code);
  const quizPassed = isQuizPassed(code);

  // If acknowledged, this module is done
  if (acknowledged) return 'acknowledged';

  // If coach review exists but not yet acknowledged
  if (coachReview) return 'coach_review';

  // If exercise is complete, waiting for coach review
  if (exerciseCompleted && quizPassed) return 'awaiting_coach';

  // If quiz passed but exercise not complete (or in progress)
  if (quizPassed) {
    // Check if there's any exercise progress at all
    if (currentValue > 0) return 'demonstrate';
    return 'quiz_passed';
  }

  // Module is unlocked but quiz not passed
  return 'learn';
}

// ─── Master Detection ────────────────────────────────────────────────────────

/**
 * Master detection function — runs all 5 module checks, applies sequential gating,
 * quiz requirements, coach review, and acknowledgment tracking.
 */
export function detectAllModules(): ModuleProgress[] {
  const user = getStoredUser();
  const userId = user?.id ?? 'unknown';

  const acad101 = detectAcad101(userId);
  const acad102 = detectAcad102();
  const acad103 = detectAcad103();
  const acad104 = detectAcad104();
  const acad105 = detectAcad105();

  const record = getCertificationRecord(userId);
  const isAllCertified = record?.isLevel1Certified === true;

  const rawData: Record<
    AcademyModuleCode,
    { completed: boolean; currentValue: number }
  > = {
    'ACAD-101': acad101,
    'ACAD-102': { completed: acad102.completed, currentValue: acad102.currentValue },
    'ACAD-103': { completed: acad103.completed, currentValue: acad103.currentValue },
    'ACAD-104': { completed: acad104.completed, currentValue: acad104.currentValue },
    'ACAD-105': { completed: acad105.completed, currentValue: acad105.currentValue },
  };

  const extraData: Partial<Record<AcademyModuleCode, string>> = {
    'ACAD-102': `${acad102.orgCount} orgs, ${acad102.activityCount} activities`,
    'ACAD-103': `${acad103.oppsWithNeeds} opps with needs / ${acad103.oppCount} total`,
    'ACAD-104': `${acad104.proposalOpps} proposal opps`,
    'ACAD-105': `${acad105.closedWonOpps} closed won`,
  };

  return LEVEL_1_MODULES.map((mod) => {
    const raw = rawData[mod.code];
    const quizPassed = isQuizPassed(mod.code);

    // Exercise is only considered complete after quiz is passed AND raw data shows completion
    const exerciseCompleted = quizPassed && raw.completed;

    const phase = computeModulePhase(mod.code, exerciseCompleted, raw.currentValue, userId, isAllCertified);

    const coachReview = getCoachReview(mod.code);

    return {
      code: mod.code,
      phase,
      currentValue: raw.currentValue,
      targetValue:
        mod.code === 'ACAD-101'
          ? 1
          : mod.code === 'ACAD-102'
            ? 8 // 5 orgs + 3 activities = 8 combined
            : mod.code === 'ACAD-103'
              ? 1
              : mod.code === 'ACAD-104'
                ? 1
                : 1,
      label:
        mod.code === 'ACAD-101'
          ? 'mission statement'
          : mod.code === 'ACAD-102'
            ? 'orgs + activities'
            : mod.code === 'ACAD-103'
              ? 'opps with needs'
              : mod.code === 'ACAD-104'
                ? 'proposal opps'
                : 'closed won opps',
      extra: extraData[mod.code],
      coachReview: coachReview ?? undefined,
    };
  });
}

// ─── Completion Helpers ──────────────────────────────────────────────────────

/**
 * Returns true if all 5 modules are acknowledged (Coach Review acknowledged by rep).
 * This combines with Director certification to achieve DEPLOY status.
 */
export function isLevel1Complete(progress: ModuleProgress[]): boolean {
  return progress.every(
    (p) => p.phase === 'acknowledged' || p.phase === 'certified'
  );
}

/**
 * Returns certification progress percentage based on acknowledged modules.
 */
export function certificationProgress(progress: ModuleProgress[]): number {
  const done = progress.filter(
    (p) =>
      p.phase === 'acknowledged' ||
      p.phase === 'certified' ||
      p.phase === 'coach_review'
  ).length;
  return Math.round((done / progress.length) * 100);
}

/**
 * Count modules that have coach review (waiting on acknowledgment or already acknowledged).
 */
export function verifiedModuleCount(progress: ModuleProgress[]): number {
  return progress.filter(
    (p) =>
      p.phase === 'awaiting_coach' ||
      p.phase === 'coach_review' ||
      p.phase === 'acknowledged' ||
      p.phase === 'certified'
  ).length;
}

// ─── Certification Storage ───────────────────────────────────────────────────

const CERTIFICATION_KEY = 'tuf_academy_certification';

export interface CertificationRecord {
  userId: string;
  userName: string;
  role: string;
  isLevel1Certified: boolean;
  certificationTitle: string;
  certifiedAt?: string;
  certifiedBy?: string;
  moduleProgress: ModuleProgress[];
  lastChecked: string;
}

export const CERTIFICATION_TITLE = 'Level 1 Certified Territory Account Executive';

export function getCertificationRecord(userId: string): CertificationRecord | null {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    if (!raw) return null;
    const records = JSON.parse(raw) as Record<string, CertificationRecord>;
    return records[userId] || null;
  } catch {
    return null;
  }
}

/**
 * Save certification progress WITHOUT auto-certifying.
 */
export function saveCertificationRecord(record: CertificationRecord): void {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    const records = raw
      ? (JSON.parse(raw) as Record<string, CertificationRecord>)
      : {};
    // Preserve existing certification status if already certified
    const existing = records[record.userId];
    if (existing?.isLevel1Certified) {
      record.isLevel1Certified = true;
      record.certifiedAt = existing.certifiedAt;
      record.certifiedBy = existing.certifiedBy;
      record.certificationTitle = existing.certificationTitle || CERTIFICATION_TITLE;
    }
    records[record.userId] = record;
    localStorage.setItem(CERTIFICATION_KEY, JSON.stringify(records));
  } catch {
    // fail silently
  }
}

export function getAllCertificationRecords(): CertificationRecord[] {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    if (!raw) return [];
    return Object.values(
      JSON.parse(raw) as Record<string, CertificationRecord>
    );
  } catch {
    return [];
  }
}

// ─── Certification Submission Storage ───────────────────────────────────────

const SUBMISSION_KEY = 'tuf_academy_submission';

export interface CertificationSubmission {
  userId: string;
  userName: string;
  submittedAt: string;
  moduleProgress: SubmittedModuleDetail[];
}

export interface SubmittedModuleDetail {
  code: AcademyModuleCode;
  quizScore: number;
  quizPassed: boolean;
  quizAttempts: number;
  exerciseVerified: boolean;
  exerciseValue: number;
  exerciseTarget: number;
}

export function getSubmission(userId: string): CertificationSubmission | null {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return null;
    const submissions = JSON.parse(raw) as Record<string, CertificationSubmission>;
    return submissions[userId] ?? null;
  } catch {
    return null;
  }
}

export function submitForApproval(
  userId: string,
  userName: string
): CertificationSubmission {
  const progress = detectAllModules();
  const quizResults = getQuizResults();

  const moduleDetails: SubmittedModuleDetail[] = LEVEL_1_MODULES.map((mod) => {
    const quiz = quizResults[mod.code];
    const prog = progress.find((p) => p.code === mod.code);
    return {
      code: mod.code,
      quizScore: quiz?.score ?? 0,
      quizPassed: quiz?.passed ?? false,
      quizAttempts: quiz?.attempts ?? 0,
      exerciseVerified:
        prog?.phase === 'awaiting_coach' ||
        prog?.phase === 'coach_review' ||
        prog?.phase === 'acknowledged' ||
        prog?.phase === 'certified',
      exerciseValue: prog?.currentValue ?? 0,
      exerciseTarget: prog?.targetValue ?? 0,
    };
  });

  const submission: CertificationSubmission = {
    userId,
    userName,
    submittedAt: new Date().toISOString(),
    moduleProgress: moduleDetails,
  };

  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    const submissions = raw
      ? (JSON.parse(raw) as Record<string, CertificationSubmission>)
      : {};
    submissions[userId] = submission;
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
  } catch {
    // fail silently
  }

  return submission;
}

export function getAllSubmissions(): CertificationSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return [];
    return Object.values(
      JSON.parse(raw) as Record<string, CertificationSubmission>
    );
  } catch {
    return [];
  }
}

export function clearSubmission(userId: string): void {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (raw) {
      const submissions = JSON.parse(raw) as Record<string, CertificationSubmission>;
      delete submissions[userId];
      localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
    }
  } catch {
    // fail silently
  }
}

// ─── Director Approval ───────────────────────────────────────────────────────

/**
 * Director approves a rep: certifies them as Level 1 Certified Territory Account Executive.
 */
export function directorApproveRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): CertificationRecord | null {
  // Only certify if the rep has submitted for approval
  const submission = getSubmission(repUserId);
  if (!submission) return null;

  // Verify all modules are complete (quiz + exercise)
  const allQuizzesPassed = submission.moduleProgress.every((m) => m.quizPassed);
  const allExercisesVerified = submission.moduleProgress.every(
    (m) => m.exerciseVerified
  );
  if (!allQuizzesPassed || !allExercisesVerified) return null;

  const progress = detectAllModules();

  const record: CertificationRecord = {
    userId: repUserId,
    userName: repUserName,
    role: 'REP',
    isLevel1Certified: true,
    certificationTitle: CERTIFICATION_TITLE,
    certifiedAt: new Date().toISOString(),
    certifiedBy: directorName,
    moduleProgress: progress,
    lastChecked: new Date().toISOString(),
  };

  saveCertificationRecord(record);

  // Update the user record so the front-end reflects certification
  updateUserCertificationStatus(repUserId, true);

  // Clear the submission after approval
  clearSubmission(repUserId);

  // Also update the server-side is_certified flag via API
  callCertifyApi(repUserId).catch((err) => {
    console.warn('[TUF Academy] Failed to sync certification to server:', err);
  });

  return record;
}

/**
 * Legacy alias for backward compatibility.
 * @deprecated Use directorApproveRep instead.
 */
export function directorCertifyRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): CertificationRecord | null {
  return directorApproveRep(repUserId, repUserName, directorName);
}

function updateUserCertificationStatus(
  userId: string,
  isCertified: boolean
): void {
  try {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (raw) {
      const current = JSON.parse(raw);
      if (current.id === userId) {
        current.isCertified = isCertified;
        localStorage.setItem('tuf_ops_user_v3', JSON.stringify(current));
        window.dispatchEvent(
          new CustomEvent('tuf:user-updated', { detail: current })
        );
      }
    }
    // Also update in tuf_ops_users_v7
    const usersRaw = localStorage.getItem('tuf_ops_users_v7');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const updated = users.map((u: any) =>
        u.id === userId ? { ...u, isCertified } : u
      );
      localStorage.setItem('tuf_ops_users_v7', JSON.stringify(updated));
    }
  } catch {
    // fail silently
  }
}

/**
 * Call the server-side certify endpoint to persist is_certified in the database.
 */
async function callCertifyApi(userId: string): Promise<void> {
  const API_BASE = typeof window !== 'undefined' && (window as any).__VITE_API_BASE_URL__
    ? (window as any).__VITE_API_BASE_URL__
    : '/api';
  const numericId = userId.replace(/\D/g, '');
  // Auth token from localStorage for the Director performing the certification
  const rawUser = localStorage.getItem('tuf_ops_user_v3');
  const token = rawUser ? JSON.parse(rawUser).token : null;
  const response = await fetch(`${API_BASE}/v1/auth/users/${numericId}/certify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Certify API returned ${response.status}`);
  }
}

// ─── Deprecated: Page Visited Tracking (kept for backward compatibility) ─────

const VISITED_PAGES_KEY = 'tuf_academy_visited_pages';

function getVisitedPages(): Set<string> {
  try {
    const raw = localStorage.getItem(VISITED_PAGES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markPageVisited(page: string): void {
  const visited = getVisitedPages();
  visited.add(page);
  localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify([...visited]));
}
