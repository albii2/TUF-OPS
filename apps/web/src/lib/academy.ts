/**
 * TUF Academy — Module definitions, quizzes, Learn→Demonstrate→Coach Review→Deploy flow,
 * Director feedback loop, and "Level 1 Certified Territory Account Executive" title.
 *
 * Governing specs:
 *   docs/canon/SOS_v1.0.md Section 2.3 (Sales Philosophy)
 *   docs/canon/Academy_v1.0.md
 *
 * MODULE STRUCTURE:
 *   TAE TRACK (Level 1 — Territory Account Executive, role REP):
 *     ACAD-101: The TUF Philosophy
 *     ACAD-102: Prospecting
 *     ACAD-103: Discovery
 *     ACAD-104: Proposal
 *     ACAD-105: Order Handoff
 *     ACAD-106: Product Knowledge
 *
 *   DIRECTOR TRACK (Level 1 — State Director, roles DIRECTOR / REGIONAL_DIRECTOR):
 *     DIR-1: The Director Role
 *     DIR-2: Recruiting Your Team
 *     DIR-3: Certifying and Coaching Reps
 *     DIR-4: Territory Management
 *     DIR-5: Pipeline Leadership
 *
 * PHASES PER MODULE:
 *   LEARN → DEMONSTRATE → COACH REVIEW → DEPLOY
 */

import { listOrganizations } from '../services/organizationsService';
import { listOpportunities } from '../services/opportunitiesService';
import { listActivities } from '../services/activitiesService';
import { getCandidates } from '../services/recruitingService';
import { getStoredUser } from '../auth';

// ─── Module Definitions ─────────────────────────────────────────────────────

export type TAEModuleCode = 'ACAD-101' | 'ACAD-102' | 'ACAD-103' | 'ACAD-104' | 'ACAD-105' | 'ACAD-106' | 'ACAD-107';
export type DirectorModuleCode = 'DIR-1' | 'DIR-2' | 'DIR-3' | 'DIR-4' | 'DIR-5' | 'DIR-6';
export type AcademyModuleCode = TAEModuleCode | DirectorModuleCode;

export function isDirectorModuleCode(code: AcademyModuleCode): code is DirectorModuleCode {
  return code.startsWith('DIR-');
}

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
  {
    code: 'ACAD-106',
    name: 'Product Knowledge',
    description:
      'The 4-lane program system, 7 quality standards, 8 collections — know what TUF builds and why.',
    completionCriteria:
      'Pass the product knowledge quiz (80%) and deliver a 5-minute product walkthrough to your Director.',
    demonstrateTask:
      'Deliver a 5-minute product walkthrough to your Director covering one collection, three quality standards with physical samples, and the 4-lane system.',
    philosophyPrinciple: 1, // We sell trust before apparel
    learnContent: [
      {
        heading: 'The 4-Lane Program System — TUF\'s Moat',
        body: 'TUF doesn\'t sell uniforms. TUF outfits entire athletic programs across four lanes:\n\n1. UNIFORMS — Game-day uniforms for every sport (GRIND, DIAMOND, SHIFT, OVERTIME)\n2. TRAVEL GEAR — ISSUE collection: tech suits, duffles, backpacks, one system\n3. TEAM STORES — Fan gear, spirit wear, booster merchandise for the community\n4. LETTERMAN JACKETS — LEGACY collection: the jacket that carries the program\'s tradition\n\nNobody else thinks about a school this way. Other vendors sell products. TUF builds program identity across all four lanes. That\'s the moat — once a school is across 3-4 lanes, leaving means breaking four relationships and rebuilding their entire visual identity from scratch.',
      },
      {
        heading: 'The 8 Collections — What Athletes Wear',
        body: 'GRIND™ — Football. Game-day uniforms built for the physical work.\nDIAMOND™ — Baseball / Softball. Named for the field of play.\nSHIFT™ — 7v7 / Flag. Motion, adaptation, speed.\nOVERTIME™ — Basketball. Clutch moments, when the game is on the line.\nISSUE™ — Travel Gear. Team-issued. Exclusive. Earned, not sold.\nCAMP™ — Performance Apparel. Training gear, warmups, off-field athlete wear.\nSIDELINE™ — Coaches Collection. What the leader wears on the sideline.\nLEGACY™ — Letterman Jackets. Tradition. The jacket that carries the program\'s history.\n\nEvery collection has a reason for its name. Know the reason. A coach asking "why GRIND?" deserves an answer.',
      },
      {
        heading: 'The 7 Quality Standards — What TUF Demands from Every Product',
        body: 'PRO CUT™ — Athletic competition fit derived from inside knowledge of college/pro patterns. Not stock blanks. Athletic taper, articulated sleeves, reduced bulk.\n\nFLEX-WAIST™ — Reversible basketball waistband. 360-degree stretch. No bunching, no twisting, flips clean. Women\'s basketball athletes have been folding their shorts for years — nobody named the problem. TUF did.\n\nPOWER-STRETCH™ — 4-way stretch with shape recovery. Moves with the athlete in every direction. Doesn\'t bag out after repeated wear.\n\nAIR-FORGE™ — Laser-cut ventilation mapped to high-heat zones. Air flows where athletes generate heat — not random holes.\n\nLOCK-FIT™ — Reinforced construction. Triple-stitched stress points, taped seams, reinforced neck, grip waistband. Built to survive a season.\n\nIRONCLAD GUARANTEE™ — If anything goes wrong, TUF fixes it. Period. Not pro-rated. Not "within reason." Fixed.\n\nPACKSYSTEM™ — Integrated travel gear system. Tech suit, duffle, backpack designed as one unified system — not three separate products.',
      },
      {
        heading: 'The 3-Thing Close — What Every Rep Delivers',
        body: 'Every TUF uniform comes down to three things:\n\n1. THE PRO LOOK — The aesthetic standard athletes recognize as premium. Built from inside knowledge of what college and pro programs actually wear.\n2. PRO-STANDARD FIT — Built to specifications derived from college/pro patterns. Not generic stock sizing.\n3. IRONCLAD GUARANTEE — If anything goes wrong, we make it right. No questions. No runaround. Fixed.\n\nMemorize this. Deliver it. Don\'t read it off a sheet — say it like you mean it.',
      },
      {
        heading: 'The Discovery Rule — When to Use Brand Language',
        body: 'First 10 minutes of a discovery call: ZERO brand vocabulary. Ask about the coach\'s program. Learn their pain points. Listen. The only collection name to use: "We outfit football programs through our GRIND collection" — establishes TUF has a dedicated line without launching into features.\n\nWhen the coach signals interest (minute 10-15): Introduce the 4-lane system. "Coach, here\'s what separates us. We think about your entire athletic program — game day, travel, fans, tradition — as one system. Four lanes. One look. One relationship."\n\nThe demo (minute 15-25): Show, don\'t tell. Hold up a jersey next to theirs. Let PRO CUT speak. Stretch POWER-STRETCH. Reverse FLEX-WAIST. The product proves the claim.\n\nThe close (final 5 minutes): Three things. THE PRO LOOK. PRO-STANDARD FIT. IRONCLAD GUARANTEE. Then ask: "Coach, if your athletes walked out in these, would you be proud of how they look?"',
      },
      {
        heading: 'BUILT FOR THE PROGRAM.',
        body: 'That\'s the rallying cry. Four words. It means TUF was built for the whole program — not just varsity. Built by someone who was in programs — not a corporate executive. Built for the program\'s identity — not a catalog transaction. Built to last for the program — backed by the IRONCLAD GUARANTEE.\n\nEvery rep should know those four words. Put them on your phone lock screen. Put them in your email signature. They are the answer to "what makes TUF different?"\n\nTUF is the program brand. Not a uniform vendor.',
      },
    ],
  },

  {
    code: 'ACAD-107',
    name: 'Emergency Pipeline Accelerator',
    description:
      'The 5-Day Pipeline Blast: rapid outreach, account triage, lane expansion, and converting dead air into active deals when your pipeline needs immediate volume.',
    completionCriteria:
      'Create 10+ new opportunities across 5+ accounts within 5 business days, log 5+ outreach activities.',
    demonstrateTask:
      'Execute a 5-Day Pipeline Blast: create 10+ opportunities across 5+ accounts and log 5+ outreach activities within 5 business days.',
    philosophyPrinciple: 5,
    learnContent: [
      {
        heading: 'The Emergency Pipeline Mindset',
        body: 'A thin pipeline is not a judgment \u2014 it is a math problem. Math problems have solutions.\n\nThe Emergency Pipeline Accelerator exists for one situation: you need pipeline volume RIGHT NOW across multiple accounts. This is not a sustainable long-term strategy \u2014 the four-order baseline, consistent daily activity, and systematic lane penetration are your long game. But fewer than 8 active opportunities = emergency mode.\n\nRules of the Blast:\n1. Activity volume over perfection. A good call today beats a perfect call next week.\n2. Lane expansion over new accounts. 5x easier to add a lane to an existing relationship.\n3. Speed over precision. Close enough gets you in the door \u2014 refine after contact.\n\nThe emergency pipeline blast is a finite sprint \u2014 5 business days \u2014 not a permanent operating model.',
      },
      {
        heading: 'Day 1: Account Triage',
        body: 'Open your territory. Sort active accounts by lane penetration \u2014 lowest first. You are looking for EXISTING accounts with open lanes, not new schools. Existing relationships where you have sold one or two lanes but left others sitting.\n\nExample: Jefferson High \u2014 you sold Football Uniforms 8 months ago. Travel Gear, Team Store, Letterman: untouched. That is three opportunities you can open TODAY with one call to a coach who already knows your name.\n\nPriority ranking:\n1. Active accounts with 1-2 lanes won \u2192 expand to remaining lanes\n2. Active accounts with only Uniforms \u2192 introduce Team Store and Travel Gear\n3. Accounts you contacted but never closed \u2192 re-engage with a fresh lane\n4. Cold accounts \u2192 only after exhausting 1-3\n\nDay 1 output: ranked list of 20+ accounts with specific lanes to attack.',
      },
      {
        heading: 'Day 2: Rapid Outreach Blitz',
        body: 'Block 4 hours. Phone only. No email. No research rabbit holes.\n\nThe Rapid Outreach format:\n1. Call. Introduce yourself (or remind them who you are).\n2. State the lane. "Coach, we handled your football uniforms \u2014 have you thought about a team store?"\n3. One question. "Is that something you would want to hear more about?"\n4. Log the opportunity. Yes, no, maybe \u2014 it goes in the pipeline.\n\nTarget: 20 calls in 4 hours. One call every 12 minutes. Log every single one \u2014 an unlogged call never happened.\n\nA maybe = LEAD. A yes = LEAD_ENGAGED. A "call me back in two weeks" = LEAD with a date.',
      },
      {
        heading: 'Day 3: Lane Expansion',
        body: 'Every account is at 25% lane penetration or less. Day 3 converts one-lane accounts into multi-lane relationships.\n\nFor every Uniforms deal:\n\u2022 Travel Gear \u2014 "Coach, does your team travel with matching warm-ups or bags?"\n\u2022 Team Store \u2014 "Do your parents and fans have a place to buy spirit wear?"\n\u2022 Letterman \u2014 "Who handles varsity jackets and senior achievement awards?"\n\nYou are not selling four products. You are asking four questions. The questions open the lane. Discovery fills it.\n\nTarget: introduce a second lane to 10 existing accounts. If 7 say "not right now," 3 become active pipeline \u2014 from accounts you already own.',
      },
      {
        heading: 'Day 4: Cold Start Outreach',
        body: 'Only if you have exhausted lane expansion and still need volume.\n\nThe Cold Start Script (60 seconds):\n\n"Coach [Name], this is [Your Name] with TUF Sports Apparel. I work with [neighboring school] \u2014 we handle their football uniforms and team store. Quick question: who manages your game-day uniforms right now?"\n\nWhat it does: names a nearby school (social proof), states what you do (credibility), asks a simple question (engagement). No pitch. No features.\n\nIf they are happy with their current vendor: "Totally fair. What is one thing you wish was easier about the current setup?" Now you are in discovery.\n\nTarget: 15 new accounts. Aim for 5 conversations. Log every attempt \u2014 even voicemails.',
      },
      {
        heading: 'Day 5: Pipeline Review',
        body: 'Day 5 converts Blast output into sustainable pipeline.\n\nReview every opportunity created this week:\n\u2022 LEAD \u2192 schedule the follow-up call NOW.\n\u2022 LEAD_ENGAGED \u2192 advance to DISCOVERY, book the meeting.\n\u2022 Voicemail \u2192 schedule callback #2 for next week.\n\nCleanup:\n\u2022 Dead leads after 3 attempts \u2192 CLOSED_LOST. Free the mental space.\n\u2022 Opportunities with no next action \u2192 add one. No action = not a deal.\n\nThe Blast is complete when every new opportunity has: (1) a stage, (2) a next action, (3) a date.',
      },
      {
        heading: 'The Numbers That Matter',
        body: 'Measure your blast:\n\u2022 Calls attempted\n\u2022 Conversations had\n\u2022 Opportunities created\n\u2022 New accounts contacted\n\u2022 Lane expansions in existing accounts\n\nA good 5-Day Blast: 50+ calls, 20+ conversations, 10+ new opportunities, 5+ lane expansions.\n\nSales Philosophy #5: Activity creates opportunity. The blast is pure activity. More calls = more conversations = more pipeline. When your Director asks about your pipeline next week, you will have data \u2014 not excuses.',
      },
    ],
  },

];

/** Director Track — State Director modules */
export const DIRECTOR_MODULES: AcademyModule[] = [
  {
    code: 'DIR-1',
    name: 'The Director Role',
    description:
      'Owning a state territory, the 4-6 TAE team model, revenue responsibility, and the weekly operating rhythm.',
    completionCriteria:
      'Write your State Ownership Brief — your state, your revenue responsibility, your weekly rhythm — reviewed by VP Sales.',
    demonstrateTask:
      'Write your State Ownership Brief: your state, your team plan, your revenue responsibility, and your weekly rhythm. Submit it for VP review.',
    philosophyPrinciple: 3, // Four healthy orders beat one lucky order
    learnContent: [
      {
        heading: 'You Own a State',
        body: 'A State Director owns a state territory the way a TAE owns an account list. Every school, every club, every program in your state is either being worked or being ignored — and both are your responsibility.\n\nYou are not a super-rep. Your job is not to out-sell your team. Your job is to build the machine that sells: recruit the right TAEs, certify them, assign them territory, and coach them to the four-order floor.\n\nWhen your state hits its number, it will be because you built a team that hits its numbers.',
      },
      {
        heading: 'The 4-6 TAE Team Model',
        body: 'A state runs on 4-6 Territory Account Executives. Fewer than 4 and you cannot cover the state. More than 6 and you cannot coach them properly.\n\nThe math is simple:\n\n5 TAEs × 4 healthy orders per month = 20 orders per month for your state.\n\nThat is the baseline — consistency over size. One rep landing a whale does not fix three reps at zero. Four healthy orders per rep, every month, is what a healthy state looks like.\n\nEvery hire you make either raises that floor or lowers it. Recruit accordingly.',
      },
      {
        heading: 'Revenue Responsibility',
        body: 'Your number is the sum of your team\'s numbers. There is no separate Director quota that saves you — if your reps miss, you missed.\n\nThat means you manage leading indicators, not outcomes:\n\n• Territory Coverage — what % of assigned accounts have activity?\n• Pipeline health — does every rep have deals in every stage?\n• Account Penetration — are reps developing all four lanes, or just selling uniforms?\n\nRevenue is the result. Coverage, activity, and pipeline are what you actually manage.',
      },
      {
        heading: 'The Weekly Rhythm',
        body: 'Directors run on a fixed weekly cadence. The rhythm is the job:\n\nMonday — Team pipeline review. Every rep, every active deal, next action and date on each.\n\nMidweek — Ride-alongs and call reviews. Sit in on discovery calls. Watch a rep present a proposal. Coach in the moment.\n\nOngoing — Certifications. Review Academy submissions, deliver Coach Reviews, run practical exercises with reps in training.\n\nFriday — Forecast. What closes this month? What is stuck? What escalates?\n\nSkip a week and you will feel it in the pipeline three weeks later. The rhythm is not optional.',
      },
      {
        heading: 'What Success Looks Like',
        body: 'A successful state, ninety days in:\n\n• 4-6 TAEs recruited, certified, and deployed.\n• Every account in the state assigned to a rep — no orphan schools.\n• Every rep building toward the four-order monthly floor.\n• A pipeline review rhythm the team can set their watch by.\n\nYou will know you are doing the job right when the state produces without you touching individual deals. Build the machine. Then keep it tuned.',
      },
    ],
  },
  {
    code: 'DIR-2',
    name: 'Recruiting Your Team',
    description:
      'Sourcing TAEs, running the interview process, evaluating for pipeline-building aptitude, extending offers, and the HR handoff.',
    completionCriteria:
      'Add 3+ candidates to your recruiting pipeline and advance at least one through an interview stage.',
    demonstrateTask:
      'Add 3 candidates to the recruiting pipeline, log your evaluation notes, and advance at least one candidate through an interview stage.',
    philosophyPrinciple: 4, // Coaches buy from people
    learnContent: [
      {
        heading: 'Where TAEs Come From',
        body: 'The best TAE candidates come from three pools:\n\n1. Coaches — current or former. They speak the customer\'s language natively. A coach selling to coaches skips two years of credibility-building.\n\n2. Ex-athletes — they understand programs from the inside, they are competitive, and they know what game-day gear means to a team.\n\n3. Salespeople — proven pipeline builders from other industries. They bring process discipline; you teach them the sport.\n\nRemember Sales Philosophy #4: coaches buy from people. The rep IS the product. When you recruit, you are choosing the product TUF puts in front of every coach in that territory.',
      },
      {
        heading: 'The Interview Process',
        body: 'Run a structured process — do not hire off one good conversation:\n\n1. Screen — 20 minutes. Why sales? Why sports? What is their connection to athletic programs?\n\n2. Deep interview — walk their history. Look for evidence of consistent self-driven work: building a program, a client book, a training regimen.\n\n3. Pipeline exercise — give them a hypothetical territory of 40 schools and ask: \"Walk me through your first two weeks.\" Listen for research, prioritization, and daily activity — not just \"I\'d call the big schools.\"\n\n4. Final conversation — sell the role honestly and confirm mutual fit.\n\nEvery candidate goes through every stage. The process protects you from charm.',
      },
      {
        heading: 'Evaluating for Pipeline-Building Aptitude',
        body: 'You are hiring for one core aptitude: the ability to build pipeline through consistent activity.\n\nGreen flags:\n\n• They describe process, not luck. \"I blocked two hours every morning for outreach.\"\n• They ask about the territory and the accounts before asking about the commission.\n• They are comfortable talking to coaches — or already are one.\n\nRed flags:\n\n• Whale hunters. \"I closed one huge deal at my last job\" with no answer for what the other eleven months looked like.\n• Closers with no prospecting history. TUF reps build their own pipeline — there is no lead faucet.\n• Anyone who talks product before relationships. We sell trust before apparel.',
      },
      {
        heading: 'Extending Offers',
        body: 'When you extend an offer, sell the role the same way we sell uniforms — honestly:\n\n• The territory: real accounts, assigned by name, no phantom \"unlimited opportunity\" talk.\n• The floor: four healthy orders per month is the standard, and you will coach them to it.\n• The Academy: certification comes before full CRM access. They earn deployment.\n• The support: weekly pipeline reviews, ride-alongs, and a Director who answers the phone.\n\nSet expectations at the offer stage and your coaching conversations get easier for the next year. Surprise them now and you will pay for it monthly.',
      },
      {
        heading: 'Onboarding Handoff to HR',
        body: 'Once a candidate accepts, hand them to HR the same way a rep hands an order to Operations — complete, with nothing missing:\n\n• Signed offer and NDA\n• 90-day performance agreement\n• Commission structure form\n• Start date and Academy enrollment\n\nApply the Director QA question to your own handoff: can HR onboard this person without contacting you again? If the answer is no, the handoff is not done.\n\nYour job on day one of their employment: territory assigned, Academy access live, first week scheduled. A rep who starts with a plan produces a month faster than one who starts with a shrug.',
      },
    ],
  },
  {
    code: 'DIR-3',
    name: 'Certifying and Coaching Reps',
    description:
      'How Academy certification works, Coach Review responsibilities, running practical exercises, when to sign off, and the ongoing coaching cadence.',
    completionCriteria:
      'Deliver at least one Coach Review (Strengths, Corrections, Coaching Notes) for a rep module submission.',
    demonstrateTask:
      'Review a rep\'s module submission and deliver a Coach Review with specific Strengths, Corrections, and Coaching Notes.',
    philosophyPrinciple: 7, // The Director QA question
    learnContent: [
      {
        heading: 'How Academy Certification Works',
        body: 'Every rep moves through the same flow on every module:\n\nLearn → Demonstrate → Coach Review → Deploy.\n\nLearn: the rep studies the module content and passes the assessment at 80% or better.\n\nDemonstrate: the rep performs real work in the CRM — real organizations, real activities, real opportunities. Exercises are auto-detected from CRM data, not self-reported.\n\nCoach Review: you review the work and deliver written feedback. The rep must acknowledge it before moving on.\n\nDeploy: when every module is acknowledged and you approve the certification, the rep becomes a Level 1 Certified Territory Account Executive.\n\nYou are the quality gate in that flow. The system tracks progress; you judge readiness.',
      },
      {
        heading: 'The Coach Review',
        body: 'A Coach Review has three parts, and all three matter:\n\nStrengths — what the rep did well, specifically. \"Good job\" is not feedback. \"Your discovery notes mapped all four lanes for every sport\" is.\n\nCorrections — what must change before you would put this rep in front of a coach. Name the gap and the fix.\n\nCoaching Notes — the bigger-picture guidance: habits, mindset, what to focus on next.\n\nDo not rubber-stamp. A rep who gets a hollow review learns that the bar is decorative. The review is your coaching voice on the record — the rep reads it, acknowledges it, and carries it into the next module.',
      },
      {
        heading: 'Running Practical Exercises',
        body: 'The Demonstrate phase is where knowledge becomes skill — and where you actually learn who your rep is.\n\n• Watch the CRM, not just the checkboxes. Five organizations added in five minutes with empty notes is activity theater, not prospecting.\n\n• Ride along on the first real discovery call. Let the rep run it. Take notes. Coach afterward, not during.\n\n• For the product walkthrough (ACAD-106), sit as the skeptical coach. Push back on price. Ask \"why GRIND?\" If the rep cannot answer you, they cannot answer a real coach.\n\nThe exercise is not paperwork on the way to certification. It is the certification.',
      },
      {
        heading: 'When to Sign Off',
        body: 'Quiz scores measure knowledge. Certification is a judgment call, and it is yours.\n\nBefore you approve, ask two questions:\n\n1. \"Would I trust this rep with one of our schools?\" Not a practice account — a real program, a real coach, TUF\'s real reputation.\n\n2. The Director QA question, applied to training: \"Can this rep run the pipeline without me stepping in on every deal?\"\n\nIf either answer is no, do not sign off. Send the rep back with a specific correction and a specific next step. Certifying an unready rep does not help them — it hands your hardest coaching problem a live territory.',
      },
      {
        heading: 'Ongoing Coaching Cadence',
        body: 'Certification is the start of coaching, not the end of it:\n\n• Weekly 1:1 — pipeline first, then skills. What moved? What is stuck? What is the next action on every active deal?\n\n• Monthly ride-along — stay close to how the rep actually sells, not just what the CRM says.\n\n• Coach from the pipeline. A rep below the four-order floor has a visible cause: not enough activity, weak discovery, or stalled proposals. The pipeline tells you which. Coach that — not everything at once.\n\nRelationships compound with reps the same way they do with coaches. Consistent, specific coaching every week beats a quarterly performance lecture every time.',
      },
    ],
  },
  {
    code: 'DIR-4',
    name: 'Territory Management',
    description:
      'Assigning organizations, coverage strategy, lane penetration across the territory, reading the territory map, and reassignment decisions.',
    completionCriteria:
      'Every account in your territory assigned to a rep — verify at least 5 accounts have owners and coverage activity.',
    demonstrateTask:
      'Review your territory map, confirm every account has an assigned rep (at least 5 verified), and correct any coverage gaps.',
    philosophyPrinciple: 5, // Activity creates opportunity
    learnContent: [
      {
        heading: 'Assigning Organizations',
        body: 'Rule one of territory management: every account has an owner. An unassigned school is a school being sold to by someone else.\n\nAssign with density in mind:\n\n• Mix metro and outstate for every rep. Metro schools are dense and get prospected at volume. Outstate schools are sparse but reward deeper relationships. No rep gets all of one.\n\n• Match reps to geography they can actually work — a rep\'s home base matters even in a remote-first model.\n\n• No unassigned pools. A \"we\'ll get to it\" list is a graveyard. If a school exists in your state, a named rep owns it.',
      },
      {
        heading: 'Coverage Strategy',
        body: 'Territory Coverage is the percentage of assigned accounts with real activity — calls, visits, discovery conversations.\n\nCoverage is your leading indicator. Activity creates opportunity: a territory at 70% coverage will out-produce a territory at 30% coverage every quarter, regardless of who has the flashier deal this month.\n\nRead coverage before you read revenue:\n\n• Low coverage, low revenue — activity problem. Coach prospecting habits.\n• High coverage, low revenue — conversion problem. Coach discovery and proposals.\n• Low coverage, high revenue — a lucky whale is hiding the rot. Fix it before the whale swims off.',
      },
      {
        heading: 'Lane Penetration Across the Territory',
        body: 'Every account has four lanes: Uniforms, Travel Gear, Team Stores, and Letterman Jackets. Territory-level lane penetration tells you which lanes your reps develop and which they ignore.\n\nThe pattern you will see everywhere: uniforms first, everything else never. Reps default to the lane that feels most like \"selling uniforms\" and leave the other three untouched.\n\nThat is your coaching opening. An account that buys uniforms already trusts the rep — the remaining lanes are revenue opportunities sitting inside a relationship that already exists.\n\nIn every pipeline review, ask the lane question: \"This account buys game uniforms. Where are we on travel gear? Team store? Letterman?\"',
      },
      {
        heading: 'Reading the Territory Map',
        body: 'The territory map shows every account in your state, who owns it, and what is happening there. Read it weekly:\n\n• Clusters of accounts with no activity — a coverage gap. Is the rep overloaded, avoiding the area, or under-prospecting?\n\n• One rep\'s zone going quiet while others produce — an early warning you will not get from monthly revenue numbers.\n\n• Account Penetration by account — which relationships are one-lane, and which are becoming programs.\n\nBring the map to your pipeline reviews. \"Walk me through this corner of your territory\" is a better coaching prompt than \"how is it going?\"',
      },
      {
        heading: 'Reassignment Decisions',
        body: 'Reassignment is a tool, not a punishment. Use it when:\n\n• Sustained inactivity — a zone with no logged activity for 30+ days and no plan to change it.\n• Structural overload — a rep genuinely cannot cover what they own while hitting the four-order floor.\n• Departure — a rep leaves; their accounts move to named owners the same week. No orphan periods.\n\nWhen you reassign, do it cleanly: update the assignment in the system, tell both reps why, and set expectations for the handoff — open deals, warm relationships, and account notes travel with the account.\n\nUse it sparingly. Reps invest months building relationships; churning territory burns that investment. But letting a dead zone stay dead to spare a feeling costs the state real revenue.',
      },
    ],
  },
  {
    code: 'DIR-5',
    name: 'Pipeline Leadership',
    description:
      'Team pipeline reviews, unblocking stuck deals, forecast discipline, escalating to VP Sales, and the 4-orders-per-month floor.',
    completionCriteria:
      'Run a team pipeline review with at least 3 active opportunities — every deal has a next action and a date.',
    demonstrateTask:
      'Run a team pipeline review: at least 3 active opportunities in the pipeline, each with a next action and owner confirmed.',
    philosophyPrinciple: 6, // Pipeline predicts success
    learnContent: [
      {
        heading: 'The Team Pipeline Review',
        body: 'Once a week, same day, same time: every rep, every active deal.\n\nThe format is fixed:\n\n• Stage — where is the deal, and does the stage match reality?\n• Next action — what specifically happens next?\n• Date — when?\n• Owner — who does it? (Almost always the rep. Occasionally you.)\n\nA deal with no next action is not a deal — it is a wish with a dollar value. The review exists to convert wishes back into deals or clear them out of the pipeline.\n\nKeep it fast. Twenty deals should take forty minutes. Deep coaching happens in 1:1s; the pipeline review is for movement.',
      },
      {
        heading: 'Unblocking Stuck Deals',
        body: 'Every stuck deal is stuck for a findable reason. Diagnose before you prescribe:\n\n• No next action — the rep does not know what to do next. Coach the play: who to call, what to ask.\n\n• Wrong contact — three weeks of \"waiting to hear back\" usually means the rep is talking to someone who cannot say yes. Find the decision-maker.\n\n• Unanswered question — \"we need to think about it\" means an objection was never surfaced. Send the rep back in to dig.\n\nCoach the rep to unblock it — do not take the deal over. Every deal you personally rescue teaches your team that stuck deals are your job. There is one exception: a strategic account at real risk. Step in, close it, then debrief the rep on exactly what you did and why.',
      },
      {
        heading: 'Forecast Discipline',
        body: 'Your forecast is built from pipeline stages and projected deal values — not from optimism.\n\nThe rules:\n\n• Deal value is projected from discovery. If a deal has no value recorded, it has no place in the forecast.\n• Stage means what it means. \"Negotiation\" with no proposal sent is not Negotiation.\n• Closed Won means the full standard: payment, roster, sizing, artwork, and the Director QA question answered yes. Nothing forecasts as won until it is actually won.\n\nPipeline predicts success. A disciplined pipeline tells you next month\'s number three weeks early — which means you can still do something about it. An inflated pipeline tells you a comfortable lie until the month ends.',
      },
      {
        heading: 'The 4-Orders-Per-Month Floor',
        body: 'Four healthy orders per rep, per month. That is the floor, not the ceiling.\n\nWhen a rep is below the floor, the cause is upstream — look 60 days back:\n\n• Thin activity 60 days ago → thin pipeline 30 days ago → missed floor today.\n\nThe floor conversation is a pipeline conversation: \"You closed one order this month. Show me your discovery conversations from six weeks ago.\" The pattern is almost always visible, and it is almost always activity.\n\nHold the floor consistently. A rep who misses one month gets coaching. A rep who misses three months with full coaching has told you something — and the 90-day performance agreement exists for exactly that conversation.',
      },
      {
        heading: 'Escalating to VP Sales',
        body: 'You own the state. Some things still go up:\n\n• Multi-state accounts — an organization whose programs cross state lines needs coordination above your level.\n• Pricing exceptions — anything below standard thresholds gets VP sign-off before the rep quotes it.\n• Systemic gaps — you cannot recruit enough TAEs, a competitor is moving on the whole state, a structural coverage problem you cannot solve with your team.\n• Personnel — terminations and performance-agreement decisions.\n\nEscalate with data, not drama: what is happening, what you already tried, what you need. \"Riverside crossed into Wisconsin, here is the account history, I need a coordination decision by Friday\" gets action. \"I have a problem\" gets a meeting.',
      },
    ],
  },

  {
    code: 'DIR-6',
    name: 'Territory Building Accelerator',
    description:
      'Rapid territory activation: account assignment, coverage planning, rep deployment, and building pipeline density across your state in 30 days.',
    completionCriteria:
      'Assign 80%+ of territory accounts to reps with owners, run 2 pipeline blasts with your team, and show 20%+ pipeline growth in 30 days.',
    demonstrateTask:
      'Assign 80%+ of accounts to rep owners, execute 2 team pipeline blasts, and demonstrate 20%+ pipeline growth within 30 days.',
    philosophyPrinciple: 6,
    learnContent: [
      {
        heading: 'Territory Is a Math Problem',
        body: 'A territory is not a geography question \u2014 it is a math equation:\n\nTotal accounts \u00d7 Average lane penetration \u00d7 Pipeline velocity = State revenue.\n\nIf any variable is weak, the result is weak. Your job as Director is to strengthen all three simultaneously.\n\nWhen you feel like your state is not producing fast enough, do not guess. Check the math:\n\n\u2022 Are all accounts assigned? (Coverage)\n\u2022 Are reps developing more than one lane per account? (Penetration)\n\u2022 Are opportunities moving through stages or sitting? (Velocity)\n\nThe math will tell you exactly where the bottleneck is \u2014 and exactly what to coach.',
      },
      {
        heading: 'Week 1: Account Assignment Blitz',
        body: 'An unassigned account is an account making zero revenue. Every day a school sits unassigned is a day someone else is selling to them.\n\nThe Account Assignment Blitz \u2014 done in one session:\n\n1. Export every account in your state.\n2. Sort by territory zone (Metro, North, West, Central).\n3. Assign each account to a specific rep by name.\n4. No "shared" accounts. One rep owns the relationship.\n5. No "unassigned" category. Every account gets an owner today.\n\nPush the assignments into the CRM immediately \u2014 do not wait for the "perfect" distribution. A slightly unbalanced assignment executed today beats a perfectly balanced assignment that sits in a spreadsheet for two weeks.\n\nTarget: 100% account assignment within your first week as Director. If you inherit an existing state with unassigned accounts, fix it this week.',
      },
      {
        heading: 'Week 2: The Territory Pipeline Blast',
        body: 'Once accounts are assigned, the entire team executes a coordinated Pipeline Blast \u2014 every rep, same week, same playbook.\n\nThis is not optional individual activity. This is a team-wide operation:\n\nMonday \u2014 Reps triage their newly assigned accounts, rank by lane penetration, identify top 20 targets.\nTuesday \u2014 Blocked outreach. 4 hours. Phone only. Lane expansion calls to existing accounts.\nWednesday \u2014 Cold outreach to untouched accounts within each rep\'s zone.\nThursday \u2014 Follow-up day. Every yes/maybe from Tue/Wed gets a second touch.\nFriday \u2014 Pipeline review. Director leads. Every rep reports: calls made, conversations had, opportunities created.\n\nYou run this as a Director \u2014 not as a participant. Your job is to set the schedule, enforce the blocks, and lead the Friday review. Do not make calls yourself. Coach your team to make them.\n\nExpected output: 50+ new opportunities across the state in one week.',
      },
      {
        heading: 'Week 3: Lane Density \u2014 Penetration Over Acquisition',
        body: 'The fastest path to pipeline volume is not new accounts \u2014 it is lane expansion in existing accounts.\n\nBy Week 3, every rep should have a ranked list of their accounts sorted by lane penetration. The mission: every account with Uniforms only must have at least one additional lane opened this week.\n\nThe play is simple:\n\n1. Rep opens the account in the CRM.\n2. Identifies which lanes are already won.\n3. Attacks the NEXT lane \u2014 not all three, not the "easiest" one. The next one.\n4. One call. One question. "Coach, we handled your uniforms \u2014 have you thought about a Team Store?"\n\nLane density \u2014 the percentage of an account\'s total revenue lanes that are active \u2014 is the leading indicator of account health. An account at 25% density (one lane) will produce 25% of its potential. An account at 75% density is a program partner.\n\nYour state\'s average lane density is your report card as a Director. Drive it up.',
      },
      {
        heading: 'Week 4: Pipeline Review and Sustainment',
        body: 'The territory accelerator culminates in a state-wide pipeline review:\n\n\u2022 Total pipeline value across all reps \u2014 trending up or flat?\n\u2022 Average opportunities per rep \u2014 above or below 8 active?\n\u2022 Lane penetration by rep \u2014 who is developing multi-lane accounts and who is stuck on Uniforms?\n\u2022 Activity consistency \u2014 which reps executed the blast and which did not?\n\nFrom this review, you build your coaching priority list:\n\n1. Reps with <4 active opportunities \u2192 immediate 1:1, diagnose the activity problem.\n2. Reps with low lane density \u2192 ride-along this week, coach lane expansion conversations.\n3. Reps exceeding all metrics \u2192 recognize publicly, use them as examples.\n\nThe accelerator is not the end \u2014 it is the beginning of the operating rhythm. From here, you run the weekly pipeline review, the monthly territory health check, and the quarterly rep performance review.\n\nPipeline predicts success. After 30 days, your pipeline numbers tell you exactly what the next 60 days will produce \u2014 and where to coach.',
      },
      {
        heading: 'Territory Health \u2014 The Numbers You Track Weekly',
        body: 'Your state has vital signs. Track them weekly:\n\n1. Account Coverage \u2014 % of accounts with an assigned rep (target: 100%)\n2. Active Pipeline Count \u2014 total open opportunities across all reps (target: 5+ per rep)\n3. Lane Density \u2014 average lanes per account (target: 2.0+)\n4. Pipeline Velocity \u2014 average days from LEAD to CLOSED_WON (target: <60)\n5. Activity Volume \u2014 total outreach activities per rep per week (target: 20+)\n\nRun these five numbers every Monday. They will tell you more about your state than a two-hour meeting ever could.\n\nA Director who can say "we are at 92% coverage, 1.7 average lanes, 6.3 active opps per rep, and trending up on velocity" is a Director who runs a state \u2014 not one who is run by it.',
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
  'ACAD-106',
  'ACAD-107',
];

export const DIRECTOR_MODULE_ORDER: AcademyModuleCode[] = [
  'DIR-1',
  'DIR-2',
  'DIR-3',
  'DIR-4',
  'DIR-5',
  'DIR-6',
];

/** Returns the sequential order list for the track a module belongs to. */
export function moduleOrderFor(code: AcademyModuleCode): AcademyModuleCode[] {
  return isDirectorModuleCode(code) ? DIRECTOR_MODULE_ORDER : MODULE_ORDER;
}

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
  'ACAD-106': [
    {
      id: '106-q1',
      question: 'What are the four revenue lanes in the TUF program system?',
      options: [
        'Uniforms, Travel Gear, Team Stores, Letterman Jackets — the four lanes that outfit an entire athletic program',
        'Football, Basketball, Baseball, Hockey — the four sports TUF serves',
        'Varsity, JV, Freshman, Youth — the four levels of a program',
        'Jerseys, Shorts, Bags, Jackets — the four product categories',
      ],
      correctIndex: 0,
    },
    {
      id: '106-q2',
      question: 'A basketball coach asks why their players should care about FLEX-WAIST. What\'s the best answer?',
      options: [
        '"It\'s a patented technology that only TUF has — no other brand can do this."',
        '"Your players have been folding their shorts waistbands for years. Nobody named the problem. We did. FLEX-WAIST is a reversible waistband that flips clean, stays flat, and doesn\'t bunch up — so your athletes can focus on basketball, not adjusting their shorts."',
        '"FLEX-WAIST uses premium elastic materials that last longer than standard waistbands."',
        '"It comes standard on all TUF basketball uniforms at no extra cost."',
      ],
      correctIndex: 1,
    },
    {
      id: '106-q3',
      question: 'A football coach is on a tight budget and only wants to order varsity uniforms. Why should you introduce the 4-lane system anyway?',
      options: [
        '"Because you\'re leaving money on the table — you should order all four lanes now."',
        '"Coach, I hear you. Let\'s start with uniforms. I just want you to know the system exists — when you\'re ready for travel gear or team stores or letterman jackets, you\'re not starting from scratch. You\'re building on what we start today."',
        '"TUF requires minimum orders across at least two lanes — we can\'t do uniforms only."',
        '"The other lanes are optional. Let me show you pricing."',
      ],
      correctIndex: 1,
    },
    {
      id: '106-q4',
      question: 'Scenario: A coach has been with the same local vendor for 10 years. He says "they do sublimation just like you, and they\'re cheaper." What\'s the right response?',
      options: [
        '"Our sublimation is better quality — you get what you pay for."',
        '"Coach, sublimation is a standard process — we both do it. The question is what standard he\'s building to. Does he know how a D1 football jersey is cut? Does he have PRO CUT fit specifications? Does he back his work with an ironclad guarantee? If price is the only variable, he wins. If what your athletes look like on game day matters, let\'s talk about what\'s actually different."',
        '"We use higher-quality sublimation inks that last three times longer."',
        '"You should switch because our pricing is competitive and we have better customer service."',
      ],
      correctIndex: 1,
    },
    {
      id: '106-q5',
      question: 'What is the rallying cry that captures TUF\'s entire brand philosophy?',
      options: [
        '"BUILT FOR THE PROGRAM."',
        '"THE PRO LOOK. THE TEAM BUDGET."',
        '"WE OUTFIT PROGRAMS. NOT PLAYERS."',
        '"QUALITY YOU CAN SEE. PRICE YOU CAN AFFORD."',
      ],
      correctIndex: 0,
    },
  ],

  'ACAD-107': [
    {
      id: '107-q1',
      question: 'When should a TAE activate the Emergency Pipeline Accelerator?',
      options: [
        'When the pipeline has fewer than 8 active opportunities \u2014 emergency mode requires a different gear',
        'Every Monday morning as a standard weekly routine regardless of pipeline health',
        'Only after the Director has approved the blast in writing',
        'When the rep has closed more than 4 deals in a single month',
      ],
      correctIndex: 0,
    },
    {
      id: '107-q2',
      question: 'On Day 1 of the Pipeline Blast, what is the correct account triage priority order?',
      options: [
        'Existing accounts with 1-2 lanes won \u2192 Uniforms-only accounts \u2192 previously contacted \u2192 cold accounts',
        'Cold accounts first \u2192 then existing accounts \u2192 then previously contacted',
        'Alphabetical by school name to ensure systematic coverage',
        'Largest schools by enrollment first, regardless of relationship status',
      ],
      correctIndex: 0,
    },
    {
      id: '107-q3',
      question: 'During the Day 2 Rapid Outreach Blitz, what is the correct call format?',
      options: [
        'Call \u2192 state the lane \u2192 ask one question \u2192 log the opportunity (yes, no, or maybe)',
        'Email first \u2192 wait for response \u2192 call if no reply within 48 hours',
        'Research the coach for 15 minutes \u2192 craft a personalized pitch \u2192 present all four lanes',
        'Send a brochure \u2192 follow up with a phone call the following week',
      ],
      correctIndex: 0,
    },
    {
      id: '107-q4',
      question: 'Why is lane expansion (Day 3) prioritized over new account outreach (Day 4)?',
      options: [
        'It is 5x easier to add a lane to an existing relationship than to cold-start a new account \u2014 Sales Philosophy #4: Coaches buy from people',
        'New account outreach takes less time so it should be saved for the end of the week',
        'Lane expansion deals are always larger than new account deals',
        'The CRM requires existing accounts to have at least two lanes before new accounts can be added',
      ],
      correctIndex: 0,
    },
    {
      id: '107-q5',
      question: 'A TAE completes a 5-Day Pipeline Blast. What numbers indicate a successful execution?',
      options: [
        '50+ calls, 20+ conversations, 10+ new opportunities, 5+ lane expansions',
        '100+ calls, 50+ conversations, 2 new opportunities, unlimited follow-ups',
        'Any number of calls is fine as long as the rep felt productive',
        '25 calls, 5 conversations, 1 new opportunity \u2014 quality over quantity',
      ],
      correctIndex: 0,
    },
  ],
  'DIR-1': [
    {
      id: 'dir1-q1',
      question: 'What is the core job of a State Director?',
      options: [
        'Personally close the largest deals in the state to lead the team by example',
        'Build the machine that sells — recruit, certify, assign territory, and coach a team of TAEs to the four-order floor',
        'Manage order fulfillment and production quality for every deal the state closes',
        'Handle escalations from VP Sales and relay company announcements to the reps',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir1-q2',
      question: 'Why does a state run on 4-6 TAEs — not more, not fewer?',
      options: [
        'Fewer than 4 cannot cover the state; more than 6 cannot be coached properly',
        'HR budget policy caps each state at six sales hires per fiscal year',
        'Six reps is the maximum the CRM supports per territory',
        'Four reps is the minimum required before a Director earns commission overrides',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir1-q3',
      question: 'One of your five reps closes a $30,000 letterman order in March. Your other four reps closed zero orders. Applying Sales Philosophy #3 ("Four healthy orders beat one lucky order"), how should you read the month?',
      options: [
        'A strong month — the state total exceeded target, which is what leadership measures',
        'A weak month disguised by a whale — four reps produced nothing, and the baseline of consistent orders per rep is what a healthy state looks like',
        'An average month — big orders and zero months balance out over a full year',
        'A staffing problem — the four reps at zero should be replaced immediately',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir1-q4',
      question: 'What belongs in a Director\'s fixed weekly rhythm?',
      options: [
        'Monday pipeline review, midweek ride-alongs and call reviews, ongoing certification work, Friday forecast',
        'Daily deal-by-deal approvals for every stage change a rep makes in the CRM',
        'A monthly all-hands meeting and quarterly territory reviews — weekly cadence is micromanagement',
        'Rotating each week\'s focus so no two weeks look the same',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir1-q5',
      question: 'As a Director, which numbers do you actually manage day to day?',
      options: [
        'Closed revenue — it is the only number the company banks',
        'Leading indicators — territory coverage, pipeline health, and account penetration; revenue is the result',
        'Quiz scores and certification dates for each rep on the team',
        'Gross margin per order across the four lanes',
      ],
      correctIndex: 1,
    },
  ],
  'DIR-2': [
    {
      id: 'dir2-q1',
      question: 'What are the three best sourcing pools for TAE candidates?',
      options: [
        'Coaches, ex-athletes, and proven salespeople from other industries',
        'Recent marketing graduates, retail associates, and customer service reps',
        'Referrals from current customers, job boards, and staffing agencies',
        'Former uniform vendor employees, equipment managers, and athletic trainers',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir2-q2',
      question: 'What is the single core aptitude you are hiring for in a TAE?',
      options: [
        'Closing ability — a strong closer can rescue any pipeline',
        'Product knowledge — reps must master fabrics and collections before selling',
        'The ability to build pipeline through consistent, self-driven activity',
        'Negotiation skill — pricing conversations decide most deals',
      ],
      correctIndex: 2,
    },
    {
      id: 'dir2-q3',
      question: 'A candidate interviews brilliantly. He is charming, confident, and tells a great story about a $200K deal he closed two years ago. When you ask him to walk through his first two weeks in a 40-school territory, he says "I\'d find the biggest programs and get in front of them." What should you do?',
      options: [
        'Hire him — a documented six-figure close outweighs a vague territory answer',
        'Treat it as a red flag — he is a whale hunter with no daily activity plan, and the pipeline exercise exists to expose exactly this',
        'Hire him for a metro zone where big programs are concentrated',
        'Skip the remaining stages and extend an offer before another company does',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir2-q4',
      question: 'Sales Philosophy #4 says "Coaches buy from people — the rep IS the product." What does that principle mean for recruiting?',
      options: [
        'Only former coaches should ever be hired as TAEs',
        'When you hire a TAE, you are choosing the product TUF puts in front of every coach in that territory',
        'Reps should be evaluated primarily on appearance and presentation polish',
        'The product line matters less than pricing, so hire for negotiation skill',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir2-q5',
      question: 'What must be complete before the HR onboarding handoff is done?',
      options: [
        'Signed offer and NDA, 90-day performance agreement, commission form, start date, and Academy enrollment — HR can onboard without contacting you again',
        'A verbal acceptance and a start date — HR collects the paperwork during week one',
        'The candidate\'s first territory plan and a completed Academy certification',
        'Background check, drug screening, and three professional references on file',
      ],
      correctIndex: 0,
    },
  ],
  'DIR-3': [
    {
      id: 'dir3-q1',
      question: 'What is the module flow every rep moves through in the Academy?',
      options: [
        'Study → Test → Graduate → Sell',
        'Learn → Demonstrate → Coach Review → Deploy',
        'Shadow → Practice → Solo → Certify',
        'Quiz → Interview → Approval → Launch',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir3-q2',
      question: 'What are the three parts of a Coach Review?',
      options: [
        'Score, Ranking, and Next Module',
        'Strengths, Corrections, and Coaching Notes',
        'Pass/Fail, Retake Date, and Signature',
        'Activity Count, Quiz Score, and Certification Decision',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir3-q3',
      question: 'A rep has passed every quiz with 90%+ and completed every practical exercise. On your ride-along, he talked over the coach for the entire call and never asked a discovery question. Should you certify him?',
      options: [
        'Yes — the certification requirements are objective, and he met all of them',
        'No — certification is your judgment call, and the question is "Would I trust this rep with one of our schools?" Send him back with a specific correction',
        'Yes, but privately flag him to VP Sales as a coaching risk',
        'No — restart him from ACAD-101 so the lesson sticks',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir3-q4',
      question: 'Why must a Director avoid rubber-stamp Coach Reviews?',
      options: [
        'Hollow reviews teach the rep that the bar is decorative — the review is your coaching voice on the record and shapes the next module',
        'Corporate audits certification records quarterly and flags short reviews',
        'Reps can appeal a review that lacks sufficient written detail',
        'Short reviews delay module unlocking in the system',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir3-q5',
      question: 'Sales Philosophy #7 is the Director QA question: "Can Operations produce this order without contacting the customer again?" How does this module apply that same standard to certification?',
      options: [
        'By requiring reps to memorize the QA question before their final quiz',
        'By asking the training version of it: "Can this rep run the pipeline without me stepping in on every deal?" — if no, don\'t sign off',
        'By having Operations review each rep\'s first three orders after certification',
        'By making the QA question the final question on every module quiz',
      ],
      correctIndex: 1,
    },
  ],
  'DIR-4': [
    {
      id: 'dir4-q1',
      question: 'What is rule one of territory management?',
      options: [
        'Metro schools always go to the most senior rep',
        'Every account has an owner — an unassigned school is a school being sold to by someone else',
        'Territory boundaries follow county lines for clean reporting',
        'Each rep\'s account list is rebalanced every quarter regardless of performance',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir4-q2',
      question: 'Why do you mix metro and outstate accounts for every rep?',
      options: [
        'It equalizes drive time so mileage reimbursements stay fair',
        'Metro schools are dense and prospected at volume; outstate schools are sparse but reward deeper relationships — no rep should get all of one',
        'Outstate schools order more letterman jackets, which balances lane revenue',
        'It prevents reps from comparing the size of their account lists',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir4-q3',
      question: 'Your territory report shows a rep at 75% coverage but well below the four-order floor. What does this pattern tell you, and what do you coach?',
      options: [
        'An activity problem — the rep needs to make more calls and visits',
        'A conversion problem — activity is happening but not turning into orders, so coach discovery and proposals',
        'A territory problem — the rep\'s accounts are too small and need to be swapped',
        'A data problem — coverage that high with low orders means the CRM is wrong',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir4-q4',
      question: 'An account has bought game uniforms from your rep for two seasons. Nothing else. In a pipeline review, what is the lane question you should ask?',
      options: [
        '"When does their uniform contract come up for renewal?"',
        '"This account buys uniforms and already trusts us — where are we on travel gear, team store, and letterman?"',
        '"Should we offer a discount to lock in next season\'s uniform order early?"',
        '"Is the coach happy with the current uniforms?"',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir4-q5',
      question: 'Sales Philosophy #5 says "Activity creates opportunity." How does a Director apply that principle at the territory level?',
      options: [
        'Read Territory Coverage before revenue — a territory at 70% coverage out-produces one at 30% every quarter, so manage the activity that creates the opportunities',
        'Require reps to log a minimum of 100 activities per week in the CRM',
        'Focus rep activity exclusively on accounts with open opportunities',
        'Reassign any account that has not produced revenue within 90 days',
      ],
      correctIndex: 0,
    },
  ],
  'DIR-5': [
    {
      id: 'dir5-q1',
      question: 'In a team pipeline review, what four things must be confirmed for every active deal?',
      options: [
        'Stage, next action, date, and owner',
        'Deal value, discount level, close date, and competitor',
        'Coach name, sport, lane, and roster size',
        'Age of deal, number of calls, proposal status, and rep quota progress',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir5-q2',
      question: 'A rep\'s $9,000 deal has sat in Negotiation for three weeks. The rep says "I\'m waiting to hear back." What is the Director\'s best move?',
      options: [
        'Call the school yourself and close the deal before it goes cold',
        'Diagnose the block with the rep — three weeks of silence usually means the wrong contact or an unsurfaced objection — and coach the rep to unblock it',
        'Move the deal back to Proposal Sent so the pipeline reflects reality',
        'Tell the rep to send a discount offer to force a decision this week',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir5-q3',
      question: 'What is forecast discipline?',
      options: [
        'Submitting the forecast to VP Sales by the same deadline every month',
        'Forecasting from pipeline stages and discovery-projected deal values — no value recorded means no place in the forecast, and nothing counts as won until the full Closed Won standard is met',
        'Always forecasting 10% below the pipeline total to stay conservative',
        'Requiring every rep to commit to a personal number at the start of the month',
      ],
      correctIndex: 1,
    },
    {
      id: 'dir5-q4',
      question: 'A rep misses the four-order floor this month. Where do you look first?',
      options: [
        'Their activity and discovery conversations from 60 days ago — a missed floor today started upstream',
        'Their closing technique on the deals that fell through this month',
        'Their territory — a rep who misses the floor probably has weak accounts',
        'Their commission plan — misaligned incentives cause most missed months',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir5-q5',
      question: 'Sales Philosophy #6 says "Pipeline predicts success." Why does a disciplined team pipeline matter more to a Director than last month\'s revenue?',
      options: [
        'Because VP Sales reviews pipeline reports more often than revenue reports',
        'Because revenue is deferred until Operations fulfills each order',
        'Because a disciplined pipeline shows next month\'s number three weeks early — while there is still time to act; last month already happened',
        'Because pipeline totals are the primary input to each rep\'s commission',
      ],
      correctIndex: 2,
    },
  ],

  'DIR-6': [
    {
      id: 'dir6-q1',
      question: 'What is the territory revenue equation?',
      options: [
        'Total accounts \u00d7 Average lane penetration \u00d7 Pipeline velocity = State revenue',
        'Total reps \u00d7 Average deal size \u00d7 Close rate = State revenue',
        'Accounts assigned \u00d7 Weekly calls \u00d7 Months active = State revenue',
        'Total opportunities \u00d7 Average value \u00d7 Win rate = State revenue',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir6-q2',
      question: 'During Week 1 (Account Assignment Blitz), what is the rule for assigning accounts?',
      options: [
        'Every account gets one owner \u2014 no shared accounts, no unassigned accounts \u2014 push assignments immediately',
        'Accounts are divided equally by revenue potential and assigned gradually over 6 weeks',
        'Top 20% of accounts get assigned first, remaining 80% stay unassigned until reps prove themselves',
        'Reps self-select their accounts based on personal relationships with coaches',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir6-q3',
      question: 'During the Week 2 Territory Pipeline Blast, what is the Director\'s role?',
      options: [
        'Set the schedule, enforce the blocks, and lead the Friday review \u2014 do not make calls yourself',
        'Make the most calls personally to lead by example and set the pace',
        'Review each rep\'s scripts for quality before they are allowed to make calls',
        'Build the target account list and hand it to reps with pre-written call scripts',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir6-q4',
      question: 'What is lane density and why does it matter?',
      options: [
        'The percentage of an account\'s total revenue lanes that are active \u2014 it is the leading indicator of account health and the Director\'s report card',
        'The total dollar value of all active opportunities divided by the number of accounts',
        'The number of reps assigned to each lane category across the state',
        'The geographic concentration of accounts within each territory zone',
      ],
      correctIndex: 0,
    },
    {
      id: 'dir6-q5',
      question: 'A Director runs territory health numbers every Monday. What five metrics should they track?',
      options: [
        'Account Coverage, Active Pipeline Count, Lane Density, Pipeline Velocity, Activity Volume',
        'Total Revenue, Profit Margin, Headcount, Expenses, Customer Satisfaction',
        'Deals Closed, Proposals Sent, Emails Sent, Meetings Held, Demos Given',
        'Account Age, Rep Tenure, Average Contract Length, Renewal Rate, Referral Count',
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
export async function detectAcad102(): Promise<{
  completed: boolean;
  currentValue: number;
  orgCount: number;
  activityCount: number;
}> {
  const orgs = await listOrganizations({});
  const validOrgs = orgs.filter((o) => o.name && o.name.trim().length > 0);

  const user = getStoredUser();
  const activities = await listActivities({});
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
export async function detectAcad103(): Promise<{
  completed: boolean;
  currentValue: number;
  oppCount: number;
  oppsWithNeeds: number;
}> {
  const user = getStoredUser();
  const opportunities = await listOpportunities({});
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
export async function detectAcad104(): Promise<{
  completed: boolean;
  currentValue: number;
  proposalOpps: number;
}> {
  const user = getStoredUser();
  const opportunities = await listOpportunities({});
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
export async function detectAcad105(): Promise<{
  completed: boolean;
  currentValue: number;
  closedWonOpps: number;
}> {
  const user = getStoredUser();
  const opportunities = await listOpportunities({});
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

/**
 * ACAD-106: Demonstrate — deliver a 5-minute product walkthrough to Director.
 * Detection: verified by Director sign-off in the certification review.
 */
export function detectAcad106(): {
  completed: boolean;
  currentValue: number;
} {
  const user = getStoredUser();
  if (!user) return { completed: false, currentValue: 0 };

  const cert = getCertificationRecord(user.id);
  if (!cert) return { completed: false, currentValue: 0 };

  const moduleData = cert.moduleProgress?.find((p) => p.code === 'ACAD-106');
  return {
    completed: !!moduleData?.coachReview,
    currentValue: moduleData?.coachReview ? 1 : 0,
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
  const order = moduleOrderFor(code);
  const idx = order.indexOf(code);

  // If the user is already fully certified, all modules show as certified
  if (isAllCertified) return 'certified';

  // Check sequential lock: the first module of a track is always available; others require
  // previous module quiz passed. Quiz pass unlocks the next module immediately.
  // Coach review happens asynchronously and does NOT block progression.
  if (idx > 0) {
    const prevCode = order[idx - 1];
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
 * Master detection function — runs all 6 module checks, applies sequential gating,
 * quiz requirements, coach review, and acknowledgment tracking.
 */

/**
 * ACAD-107: Demonstrate \u2014 TAE executes a 5-Day Pipeline Blast.
 * Detection: counts opportunities created in the last 7 days.
 */
export async function detectAcad107(): Promise<{
  completed: boolean;
  currentValue: number;
  oppsCreated: number;
}> {
  try {
    const opps = await listOpportunities({});
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = opps.filter((o) => {
      const created = o.createdAt ? new Date(o.createdAt) : null;
      return created && created >= sevenDaysAgo;
    });
    const count = recent.length;
    return { completed: count >= 10, currentValue: count, oppsCreated: count };
  } catch {
    return { completed: false, currentValue: 0, oppsCreated: 0 };
  }
}

export async function detectAllModules(): Promise<ModuleProgress[]> {
  const user = getStoredUser();
  const userId = user?.id ?? 'unknown';

  const acad101 = detectAcad101(userId);
  const acad102 = await detectAcad102();
  const acad103 = await detectAcad103();
  const acad104 = await detectAcad104();
  const acad105 = await detectAcad105();
  const acad106 = detectAcad106();
  const acad107 = await detectAcad107();

  const record = getCertificationRecord(userId);
  const isAllCertified = record?.isLevel1Certified === true;

  const rawData: Record<
    TAEModuleCode,
    { completed: boolean; currentValue: number }
  > = {
    'ACAD-101': acad101,
    'ACAD-102': { completed: acad102.completed, currentValue: acad102.currentValue },
    'ACAD-103': { completed: acad103.completed, currentValue: acad103.currentValue },
    'ACAD-104': { completed: acad104.completed, currentValue: acad104.currentValue },
    'ACAD-105': { completed: acad105.completed, currentValue: acad105.currentValue },
    'ACAD-106': { completed: acad106.completed, currentValue: acad106.currentValue },
    'ACAD-107': { completed: acad107.completed, currentValue: acad107.currentValue },
  };

  const extraData: Partial<Record<AcademyModuleCode, string>> = {
    'ACAD-102': `${acad102.orgCount} orgs, ${acad102.activityCount} activities`,
    'ACAD-103': `${acad103.oppsWithNeeds} opps with needs / ${acad103.oppCount} total`,
    'ACAD-104': `${acad104.proposalOpps} proposal opps`,
    'ACAD-105': `${acad105.closedWonOpps} closed won`,
    'ACAD-107': `${acad107.oppsCreated} opps created in last 7 days`,
  };

  return LEVEL_1_MODULES.map((mod) => {
    const raw = rawData[mod.code as TAEModuleCode];
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
                : mod.code === 'ACAD-107'
                ? 10
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
                : mod.code === 'ACAD-107'
                ? 'opps created (7 days)'
                : 'closed won opps',
      extra: extraData[mod.code],
      coachReview: coachReview ?? undefined,
    };
  });
}

// ─── Director Track Detection ────────────────────────────────────────────────

/**
 * DIR-1: Demonstrate — Director writes their State Ownership Brief.
 * Detection: reuses the mission-statement storage (per-user).
 */
export function detectDir1(userId: string): { completed: boolean; currentValue: number } {
  const written = hasMissionStatement(userId);
  return { completed: written, currentValue: written ? 1 : 0 };
}

/**
 * DIR-2: Demonstrate — Add 3 candidates to the recruiting pipeline.
 * Detection: counts candidates in the recruiting pipeline.
 */
export async function detectDir2(): Promise<{
  completed: boolean;
  currentValue: number;
  candidateCount: number;
}> {
  try {
    const candidates = await getCandidates();
    const count = Array.isArray(candidates) ? candidates.length : 0;
    return {
      completed: count >= 3,
      currentValue: Math.min(count, 3),
      candidateCount: count,
    };
  } catch {
    return { completed: false, currentValue: 0, candidateCount: 0 };
  }
}

/**
 * DIR-3: Demonstrate — Deliver at least one Coach Review for a rep module.
 * Detection: counts Coach Reviews the Director has recorded for TAE (ACAD-*) modules.
 */
export function detectDir3(): {
  completed: boolean;
  currentValue: number;
  reviewCount: number;
} {
  const reviews = getCoachReviews();
  const repReviews = Object.keys(reviews).filter((code) => code.startsWith('ACAD-'));
  return {
    completed: repReviews.length >= 1,
    currentValue: Math.min(repReviews.length, 1),
    reviewCount: repReviews.length,
  };
}

/**
 * DIR-4: Demonstrate — Verify territory coverage: accounts have assigned reps.
 * Detection: counts organizations with an assigned rep.
 */
export async function detectDir4(): Promise<{
  completed: boolean;
  currentValue: number;
  assignedOrgs: number;
  totalOrgs: number;
}> {
  try {
    const orgs = await listOrganizations({});
    const assigned = orgs.filter(
      (o) => o.assignedRep && o.assignedRep.trim().length > 0
    );
    return {
      completed: assigned.length >= 5,
      currentValue: Math.min(assigned.length, 5),
      assignedOrgs: assigned.length,
      totalOrgs: orgs.length,
    };
  } catch {
    return { completed: false, currentValue: 0, assignedOrgs: 0, totalOrgs: 0 };
  }
}

/**
 * DIR-5: Demonstrate — Run a team pipeline review with 3+ active opportunities.
 * Detection: counts team opportunities in active pipeline stages.
 */
export async function detectDir5(): Promise<{
  completed: boolean;
  currentValue: number;
  activeOpps: number;
}> {
  try {
    const opportunities = await listOpportunities({});
    const active = opportunities.filter((o) => ACTIVE_STAGES.has(o.stage));
    return {
      completed: active.length >= 3,
      currentValue: Math.min(active.length, 3),
      activeOpps: active.length,
    };
  } catch {
    return { completed: false, currentValue: 0, activeOpps: 0 };
  }
}

/**
 * Master detection for the Director track — mirrors detectAllModules for DIR-1..DIR-5.
 */

/**
 * DIR-6: Demonstrate \u2014 Director executes Territory Building Accelerator.
 * Detection: checks org assignment coverage and pipeline growth.
 */
export async function detectDir6(): Promise<{
  completed: boolean;
  currentValue: number;
  assignedOrgs: number;
  totalOrgs: number;
  activeOpps: number;
}> {
  try {
    const orgs = await listOrganizations({});
    const opps = await listOpportunities({});
    const assigned = orgs.filter((o) => o.assignedRep && o.assignedRep !== 'Unassigned');
    const pct = orgs.length ? Math.round((assigned.length / orgs.length) * 100) : 0;
    const activeOpps = opps.filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).length;
    const completed = pct >= 80 && activeOpps >= 20;
    return { completed, currentValue: pct, assignedOrgs: assigned.length, totalOrgs: orgs.length, activeOpps };
  } catch {
    return { completed: false, currentValue: 0, assignedOrgs: 0, totalOrgs: 0, activeOpps: 0 };
  }
}

export async function detectAllDirectorModules(): Promise<ModuleProgress[]> {
  const user = getStoredUser();
  const userId = user?.id ?? 'unknown';

  const dir1 = detectDir1(userId);
  const dir2 = await detectDir2();
  const dir3 = detectDir3();
  const dir4 = await detectDir4();
  const dir5 = await detectDir5();
  const dir6 = await detectDir6();

  const record = getCertificationRecord(userId);
  const isAllCertified = record?.isLevel1Certified === true;

  const rawData: Record<
    DirectorModuleCode,
    { completed: boolean; currentValue: number }
  > = {
    'DIR-1': dir1,
    'DIR-2': { completed: dir2.completed, currentValue: dir2.currentValue },
    'DIR-3': { completed: dir3.completed, currentValue: dir3.currentValue },
    'DIR-4': { completed: dir4.completed, currentValue: dir4.currentValue },
    'DIR-5': { completed: dir5.completed, currentValue: dir5.currentValue },
    'DIR-6': { completed: dir6.completed, currentValue: dir6.currentValue },
  };

  const targetValues: Record<DirectorModuleCode, number> = {
    'DIR-1': 1,
    'DIR-2': 3,
    'DIR-3': 1,
    'DIR-4': 5,
    'DIR-5': 3,
    'DIR-6': 80, // 80% coverage
  };

  const labels: Record<DirectorModuleCode, string> = {
    'DIR-1': 'state ownership brief',
    'DIR-2': 'candidates in pipeline',
    'DIR-3': 'coach reviews delivered',
    'DIR-4': 'accounts with owners',
    'DIR-5': 'active pipeline opps',
    'DIR-6': 'account coverage %',
  };

  const extraData: Partial<Record<DirectorModuleCode, string>> = {
    'DIR-2': `${dir2.candidateCount} candidates in pipeline`,
    'DIR-3': `${dir3.reviewCount} coach reviews delivered`,
    'DIR-4': `${dir4.assignedOrgs} of ${dir4.totalOrgs} accounts assigned`,
    'DIR-5': `${dir5.activeOpps} active opps`,
    'DIR-6': `${dir6.assignedOrgs} of ${dir6.totalOrgs} assigned`,
  };

  return DIRECTOR_MODULES.map((mod) => {
    const code = mod.code as DirectorModuleCode;
    const raw = rawData[code];
    const quizPassed = isQuizPassed(code);

    // Exercise is only considered complete after quiz is passed AND raw data shows completion
    const exerciseCompleted = quizPassed && raw.completed;

    const phase = computeModulePhase(code, exerciseCompleted, raw.currentValue, userId, isAllCertified);

    const coachReview = getCoachReview(code);

    return {
      code,
      phase,
      currentValue: raw.currentValue,
      targetValue: targetValues[code],
      label: labels[code],
      extra: extraData[code],
      coachReview: coachReview ?? undefined,
    };
  });
}

// ─── Completion Helpers ──────────────────────────────────────────────────────

/**
 * Returns true if all 6 modules are acknowledged (Coach Review acknowledged by rep).
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
export const DIRECTOR_CERTIFICATION_TITLE = 'Level 1 Certified State Director';

// ─── Role-Based Track Selection ──────────────────────────────────────────────

/** Roles that train on the Director track. */
export function isDirectorRole(role: string | null | undefined): boolean {
  return role === 'DIRECTOR' || role === 'REGIONAL_DIRECTOR';
}

export interface AcademyTrack {
  /** Track identifier */
  track: 'TAE' | 'DIRECTOR';
  /** Modules in this track */
  modules: AcademyModule[];
  /** Sequential module order for gating */
  order: AcademyModuleCode[];
  /** Certification title granted on completion */
  certificationTitle: string;
}

/**
 * Role-based track selector: DIRECTOR / REGIONAL_DIRECTOR train on the Director
 * track; REP (and everyone else) trains on the TAE track.
 */
export function getAcademyTrack(role: string | null | undefined): AcademyTrack {
  if (isDirectorRole(role)) {
    return {
      track: 'DIRECTOR',
      modules: DIRECTOR_MODULES,
      order: DIRECTOR_MODULE_ORDER,
      certificationTitle: DIRECTOR_CERTIFICATION_TITLE,
    };
  }
  return {
    track: 'TAE',
    modules: LEVEL_1_MODULES,
    order: MODULE_ORDER,
    certificationTitle: CERTIFICATION_TITLE,
  };
}

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

export async function submitForApproval(
  userId: string,
  userName: string
): Promise<CertificationSubmission> {
  const user = getStoredUser();
  const track = getAcademyTrack(user?.role);
  const progress =
    track.track === 'DIRECTOR'
      ? await detectAllDirectorModules()
      : await detectAllModules();
  const quizResults = getQuizResults();

  const moduleDetails: SubmittedModuleDetail[] = track.modules.map((mod) => {
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
export async function directorApproveRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): Promise<CertificationRecord | null> {
  // Only certify if the rep has submitted for approval
  const submission = getSubmission(repUserId);
  if (!submission) return null;

  // Verify all modules are complete (quiz + exercise)
  const allQuizzesPassed = submission.moduleProgress.every((m) => m.quizPassed);
  const allExercisesVerified = submission.moduleProgress.every(
    (m) => m.exerciseVerified
  );
  if (!allQuizzesPassed || !allExercisesVerified) return null;

  const progress = await detectAllModules();

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
export async function directorCertifyRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): Promise<CertificationRecord | null> {
  return directorApproveRep(repUserId, repUserName, directorName);
}

export function updateUserCertificationStatus(
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
  const API_BASE = typeof window !== 'undefined' && typeof location !== 'undefined' &&
    (location.hostname.endsWith('.vercel.app') || location.hostname === 'ops.tufsports.us' || location.hostname === 'tufops.app')
    ? '/api'
    : (typeof window !== 'undefined' && (window as any).__VITE_API_BASE_URL__
      ? (window as any).__VITE_API_BASE_URL__
      : '/api');
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

// ─── Certification Reset (clear all cert data for fresh start) ───────────────

const ALL_CERT_KEYS = [
  'tuf_academy_certification',
  'tuf_academy_submission',
  'tuf_academy_quiz_results',
  'tuf_academy_acknowledgments',
  'tuf_academy_coach_reviews',
  'tuf_academy_mission_statement',
];

/**
 * Reset all certification data for all users.
 * Clears quiz results, submissions, coach reviews, acknowledgments, mission statements,
 * and certification records. Then updates all REP/TAE users to is_certified=false.
 *
 * Call this when you need a fresh start for all certifications (e.g., pre-launch reset).
 */
export function resetAllCertifications(): void {
  // Clear all localStorage certification keys
  ALL_CERT_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // fail silently
    }
  });

  // Reset isCertified flag on all users with role REP
  try {
    // Update current user
    const rawUser = localStorage.getItem('tuf_ops_user_v3');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.role === 'REP') {
        user.isCertified = false;
        localStorage.setItem('tuf_ops_user_v3', JSON.stringify(user));
        window.dispatchEvent(
          new CustomEvent('tuf:user-updated', { detail: user })
        );
      }
    }

    // Update all users in the users list
    const usersRaw = localStorage.getItem('tuf_ops_users_v7');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const updated = users.map((u: any) =>
        u.role === 'REP'
          ? { ...u, isCertified: false }
          : u
      );
      localStorage.setItem('tuf_ops_users_v7', JSON.stringify(updated));
    }
  } catch {
    // fail silently
  }
}
