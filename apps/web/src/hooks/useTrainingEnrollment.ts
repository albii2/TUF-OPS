import { useEffect, useState } from 'react';

export type TrainingPhase = typeof ACADEMY_PHASES[number];

const TRAINING_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/training`;
const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production';

export interface TrainingModule {
  id: number;
  title: string;
  description?: string;
  role: string;
  phase: string;
  order_index: number;
  content_markdown: string;
  estimated_duration_minutes?: number;
  module_type: string;
  quiz_json?: Array<{ question: string; options: string[]; correctAnswer: string }>;
  passing_score?: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: number;
  user_id: number;
  role: string;
  status: string;
  current_phase: string;
  enrolled_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: number;
  enrollment_id: number;
  module_id: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollmentWithProgress {
  enrollment: TrainingEnrollment;
  modules: TrainingModule[];
  progress: TrainingProgress[];
  completionMetrics: {
    totalModules: number;
    completedModules: number;
    percentComplete: number;
    phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }>;
  };
}

export const ACADEMY_PHASES = [
  'LEVEL_1_OPERATOR',
  'LEVEL_2_PRODUCT',
  'LEVEL_3_TERRITORY',
  'LEVEL_4_SALES',
  'LEVEL_5_EXPANSION',
  'SPECIALIZED_TRACKS',
  'LEVEL_7_DIRECTOR',
  'MARKET_MASTERY',
] as const;

export const ACADEMY_PHASE_LABELS: Record<string, string> = {
  LEVEL_1_OPERATOR: 'Level 1 • TUF Operator',
  LEVEL_2_PRODUCT: 'Level 2 • Product',
  LEVEL_3_TERRITORY: 'Level 3 • Territory Development',
  LEVEL_4_SALES: 'Level 4 • Sales',
  LEVEL_5_EXPANSION: 'Level 5 • Account Expansion',
  SPECIALIZED_TRACKS: 'Specialized Tracks',
  LEVEL_7_DIRECTOR: 'Level 7 • Director',
  MARKET_MASTERY: 'Market Mastery',
  DAY_1: 'Legacy • Day 1',
  DAY_1_2: 'Legacy • Day 1-2',
  WEEK_1_2: 'Legacy • Week 1-2',
  MONTH_1: 'Legacy • Month 1',
};

function lessonContent(title: string, application: string, action = 'Open TUF Ops, identify five assigned athletic programs, and create one specific next action for each account before lunch.'): string {
  return `## Learning Objective\nUse ${title} to improve the rep's ability to identify, create, advance, close, or expand athletic program opportunities.\n\n## Why It Matters\nTUF Academy exists to create self-sufficient territory developers who can consistently generate a minimum of four orders per month through disciplined prospecting, consultative selling, account expansion, and ecosystem development.\n\n## Core Lesson\nLearn the operating standard, buyer context, opportunity triggers, and qualification signals connected to ${title}. The rep should connect every conversation to a current state, desired state, business gap, next step, and expansion path.\n\n## TUF-Specific Application\n${application}\n\n## Real-World Example\nA rep starts with a football uniform conversation, maps the athletic director, booster contact, youth feeder program, and seasonal buying window, then expands the account into player packs, a team store, and lettermen timing.\n\n## Common Mistakes\nTreating TUF as a generic apparel vendor; leaving calls without a next step; failing to map additional sports, boosters, youth programs, stores, player packs, lettermen, and refresh cycles.\n\n## Action Steps\n1. Identify the buyer and buying window.\n2. Diagnose the current state, desired state, and gap.\n3. Position the TUF solution with a clear commercial insight.\n4. Create a dated follow-up and ecosystem expansion path.\n\n## Knowledge Check\nScenario question: Which buyer, pain, implication, next step, and expansion opportunity should be documented before the opportunity advances?\n\n## Practical Exercise\n${action}\n\n## Tomorrow Morning\n${action}`;
}

const productApplication = (name: string, sport: string) => `${name} serves ${sport}. Reps must know what it is, who buys it, when they buy it, how to position it, typical objections, expansion opportunities, team store opportunities, player pack opportunities, lettermen opportunities, and the exact follow-up that creates the next sale.`;

const module = (id: number, phase: string, order_index: number, title: string, description: string, content: string, requiredScore: number, module_type = 'MODULE'): Omit<TrainingModule, 'role' | 'created_at' | 'updated_at'> => ({
  id,
  title,
  description: `${description} Required score: ${requiredScore}%.`,
  phase,
  order_index,
  content_markdown: content,
  estimated_duration_minutes: 30,
  module_type,
  passing_score: requiredScore,
  quiz_json: [{
    question: `What is the launch-standard behavior for ${title}?`,
    options: [
      'Create a real next step, log the work in TUF Ops, and protect the buyer relationship',
      'Skip notes and rely on memory',
      'Quote discounts before discovery',
      'Count assignment as a completed school touch',
    ],
    correctAnswer: 'Create a real next step, log the work in TUF Ops, and protect the buyer relationship',
  }],
});

const DEFAULT_TRAINING_MODULES: Array<Omit<TrainingModule, 'role' | 'created_at' | 'updated_at'>> = [
  module(1101, 'LEVEL_1_OPERATOR', 1, 'Welcome to TUF Sports Apparel', 'TUF exists to help schools, clubs, and teams buy apparel with speed, trust, and clear follow-through. Reps sell outcomes: sharper unifo', '## Training Explanation\nTUF exists to help schools, clubs, and teams buy apparel with speed, trust, and clear follow-through. Reps sell outcomes: sharper uniforms, easier parent ordering, reliable delivery, and repeatable annual programs.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nCall one assigned school and practice a 30-second TUF introduction. Done means you can explain who TUF serves, what problems we solve, and what next step you are asking for.\n\n## Practical Checkpoint\nIntroduce yourself as a territory partner, not a catalog rep. Learn the TUF lanes, buyer types, and why every conversation must end with a logged next step.\n', 85, 'MODULE'),
  module(1102, 'LEVEL_1_OPERATOR', 2, 'How TUF Makes Money', 'TUF earns through uniforms, player packs, team stores, travel gear, letterman campaigns, and repeat school relationships. Margin comes ', '## Training Explanation\nTUF earns through uniforms, player packs, team stores, travel gear, letterman campaigns, and repeat school relationships. Margin comes from disciplined pricing, clean order handoff, and expanding accounts beyond one sport.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nWrite a one-paragraph account expansion plan for one school. Done means it includes at least three revenue lanes and a realistic season trigger.\n\n## Practical Checkpoint\nProtect margin. Do not apologize for price. Tie every quote to value, speed, service, quality, and reduced administrative work for coaches and ADs.\n', 85, 'MODULE'),
  module(1103, 'LEVEL_1_OPERATOR', 3, 'Rep Expectations: 4 Orders Per Month', 'The launch standard is four completed orders per month. That requires daily touches, clean follow-up, accurate CRM notes, and enough pi', '## Training Explanation\nThe launch standard is four completed orders per month. That requires daily touches, clean follow-up, accurate CRM notes, and enough pipeline coverage to survive delays.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a weekly activity plan that can support four orders. Done means it names target schools, sports, contacts, and next actions.\n\n## Practical Checkpoint\nWork the assigned book every day: touch schools, open opportunities, follow up on invoices, and ask for referrals into feeder and youth programs.\n', 85, 'MODULE'),
  module(1104, 'LEVEL_1_OPERATOR', 4, '72-Hour Certification Standard', 'Reps have a 72-hour window to complete Academy modules, prove practical selling ability, and earn director sign-off before full CRM acc', '## Training Explanation\nReps have a 72-hour window to complete Academy modules, prove practical selling ability, and earn director sign-off before full CRM access.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nComplete the Level 1 modules and schedule practical review. Done means you can state what unlocks CRM: modules, HR docs, practical exercise, and director sign-off.\n\n## Practical Checkpoint\nMove fast. Finish modules, practice the scripts, complete the Locker Room Simulator exercise, and ask your director for review.\n', 85, 'MODULE'),
  module(1105, 'LEVEL_1_OPERATOR', 5, 'How Certification Unlocks CRM Access', 'Academy is open first. Full CRM access remains gated until required modules, HR documents, practical exercise, and director sign-off ar', '## Training Explanation\nAcademy is open first. Full CRM access remains gated until required modules, HR documents, practical exercise, and director sign-off are complete.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nReview the certification checklist. Done means you can explain why uncertified reps see Academy/dashboard only and what must happen before unlock.\n\n## Practical Checkpoint\nDo not attempt live selling from memory. Use Academy, simulator practice, and director coaching before pushing live pipeline.\n', 85, 'MODULE'),
  module(1106, 'LEVEL_2_PRODUCT', 1, 'Uniforms: TUF SHIFT, TUF GRIND, TUF OVERTIME, TUF FLEX', 'Uniform selling starts with sport, roster size, season date, current vendor pain, design expectations, and reorder needs. SHIFT, GRIND,', '## Training Explanation\nUniform selling starts with sport, roster size, season date, current vendor pain, design expectations, and reorder needs. SHIFT, GRIND, OVERTIME, and FLEX give reps language for performance, durability, speed, and program identity.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nPractice a football or basketball uniform pitch. Done means you can ask for roster size, season date, artwork needs, and mockup approval.\n\n## Practical Checkpoint\nAsk: what are you wearing now, what has to improve, when do you need it, and who approves the look? Sell a mockup or sample as the next step.\n', 85, 'MODULE'),
  module(1107, 'LEVEL_2_PRODUCT', 2, 'Player Packs and Travel Gear', 'Player packs and travel gear turn a uniform sale into a complete team package. Coaches want simplicity, consistent appearance, and fewe', '## Training Explanation\nPlayer packs and travel gear turn a uniform sale into a complete team package. Coaches want simplicity, consistent appearance, and fewer parent questions.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nCreate a player-pack upsell script. Done means it includes three pack items, buyer value, and a close for quantities.\n\n## Practical Checkpoint\nPosition packs as player readiness, team identity, and parent convenience. Attach them to every uniform conversation.\n', 85, 'MODULE'),
  module(1108, 'LEVEL_2_PRODUCT', 3, 'Team Stores', 'Team stores create fan revenue, parent convenience, and repeatable seasonal ordering. They work for schools, boosters, youth clubs, and', '## Training Explanation\nTeam stores create fan revenue, parent convenience, and repeatable seasonal ordering. They work for schools, boosters, youth clubs, and travel programs.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nDraft a team-store pitch. Done means it includes launch timing, audience, product mix, and who promotes the link.\n\n## Practical Checkpoint\nAsk who buys fan gear today, how orders are collected, and whether the coach or booster club wants fundraising.\n', 85, 'MODULE'),
  module(1109, 'LEVEL_2_PRODUCT', 4, 'Letterman Jackets', 'Letterman jackets are annual recognition campaigns. The buyer may be AD, activities office, booster, or parents. Timing and school trad', '## Training Explanation\nLetterman jackets are annual recognition campaigns. The buyer may be AD, activities office, booster, or parents. Timing and school tradition matter.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a letterman campaign checklist. Done means it includes decision maker, order window, sizing day, and follow-up date.\n\n## Practical Checkpoint\nAsk when awards are announced, how jackets are ordered today, and who manages patches/letters.\n', 85, 'MODULE'),
  module(1110, 'LEVEL_2_PRODUCT', 5, 'Price Confidence and Margin Basics', 'Price confidence protects the business. Reps must know that discounting without reason trains buyers to ignore value. Margin funds serv', '## Training Explanation\nPrice confidence protects the business. Reps must know that discounting without reason trains buyers to ignore value. Margin funds service, production, and growth.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nWrite a response to “your price is high.” Done means it defends value without attacking the competitor.\n\n## Practical Checkpoint\nWhen challenged on price, compare total value: design support, reliability, consolidated ordering, service, and repeat program planning.\n', 85, 'MODULE'),
  module(1111, 'LEVEL_3_TERRITORY', 1, 'Understanding Assigned Schools', 'Assigned schools are your book. Assignment alone is not a touch. A school is touched only when there is a logged call, email, text, mee', '## Training Explanation\nAssigned schools are your book. Assignment alone is not a touch. A school is touched only when there is a logged call, email, text, meeting, note, opportunity activity, or contact.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nPick ten assigned schools and identify first touch, likely sport, and decision maker. Done means every school has a logged plan.\n\n## Practical Checkpoint\nPrioritize Tier 1 and seasonal buying windows. Every school needs a contact, sport trigger, and next action.\n', 85, 'MODULE'),
  module(1112, 'LEVEL_3_TERRITORY', 2, 'How to Work Athletic Directors and Coaches', 'ADs control standards and relationships; coaches control pain, urgency, and team needs. Work both respectfully.', '## Training Explanation\nADs control standards and relationships; coaches control pain, urgency, and team needs. Work both respectfully.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nPractice an AD intro call. Done means you ask permission, name the value, and request one coach introduction.\n\n## Practical Checkpoint\nLead with program support, not product dumping. Ask ADs for the right coach introductions and ask coaches for roster/timeline detail.\n', 85, 'MODULE'),
  module(1113, 'LEVEL_3_TERRITORY', 3, 'Feeder Programs and Youth Extraction', 'Feeder programs create volume and future school relationships. Youth and club directors often need stores, packs, and simplified orderi', '## Training Explanation\nFeeder programs create volume and future school relationships. Youth and club directors often need stores, packs, and simplified ordering.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nAdd one feeder referral ask to your script. Done means you can ask without sounding desperate or transactional.\n\n## Practical Checkpoint\nAfter each school conversation ask: which youth programs feed this team and who runs them?\n', 85, 'MODULE'),
  module(1114, 'LEVEL_3_TERRITORY', 4, 'Travel Teams and Club Opportunities', 'Travel and club teams buy more frequently, move faster, and need identity. They can become team store and pack accounts quickly.', '## Training Explanation\nTravel and club teams buy more frequently, move faster, and need identity. They can become team store and pack accounts quickly.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nList three travel/club targets. Done means each has sport, season, buyer guess, and first touch.\n\n## Practical Checkpoint\nLook for off-season programs, tournament teams, and parent-led organizations near assigned schools.\n', 85, 'MODULE'),
  module(1115, 'LEVEL_3_TERRITORY', 5, 'How to Log a School Touch Correctly', 'If it is not logged, it did not happen. Touches must be auditable and tied to the account or opportunity.', '## Training Explanation\nIf it is not logged, it did not happen. Touches must be auditable and tied to the account or opportunity.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nLog one sample touch in training/demo. Done means the note includes who, what happened, next step, and date.\n\n## Practical Checkpoint\nLog calls, emails, texts, meetings, notes, opportunity activity, and contacts. Do not count assignment as activity.\n', 85, 'MODULE'),
  module(1116, 'LEVEL_4_SALES', 1, 'Discovery Call Framework', 'Discovery finds pain, timing, authority, budget range, sport needs, and next step. It is not a product monologue.', '## Training Explanation\nDiscovery finds pain, timing, authority, budget range, sport needs, and next step. It is not a product monologue.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nRun a five-question discovery script. Done means you can summarize current state, desired state, gap, and next step.\n\n## Practical Checkpoint\nUse questions: what are you using now, what is not working, when is the season, who signs off, and what would make switching worth it?\n', 85, 'MODULE'),
  module(1117, 'LEVEL_4_SALES', 2, 'First Contact Script', 'First contact must be short, relevant, and specific. The goal is not to close; it is to earn the next conversation.', '## Training Explanation\nFirst contact must be short, relevant, and specific. The goal is not to close; it is to earn the next conversation.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nRecord or rehearse the opening. Done means it is under 30 seconds and asks one clear question.\n\n## Practical Checkpoint\nOpening: “Coach, I work with TUF Sports Apparel. We help programs simplify uniforms, player packs, and team stores. I saw your season window coming up and wanted to ask what you are changing this year.”\n', 85, 'MODULE'),
  module(1118, 'LEVEL_4_SALES', 3, 'Handling “We Already Have a Vendor”', 'A current vendor is normal. Do not attack them. Find the gap: speed, design, communication, price clarity, store execution, or expansio', '## Training Explanation\nA current vendor is normal. Do not attack them. Find the gap: speed, design, communication, price clarity, store execution, or expansion.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nPractice three vendor-objection responses. Done means each response asks a diagnostic question.\n\n## Practical Checkpoint\nSay: “Totally fair. Most programs do. Where does your current setup work well, and where does it create friction during the season?”\n', 85, 'MODULE'),
  module(1119, 'LEVEL_4_SALES', 4, 'Getting to Mockup/Sample', 'Mockups and samples turn interest into visible progress. They must be tied to a real team, real season, and decision path.', '## Training Explanation\nMockups and samples turn interest into visible progress. They must be tied to a real team, real season, and decision path.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nCreate a mockup close. Done means you can ask for the assets and schedule the review date.\n\n## Practical Checkpoint\nAsk for colors, logo/artwork, roster count, sport, deadline, and who reviews the mockup.\n', 85, 'MODULE'),
  module(1120, 'LEVEL_4_SALES', 5, 'Follow-Up Discipline', 'Follow-up is where most reps lose deals. Every opportunity needs a next action, date, and reason.', '## Training Explanation\nFollow-up is where most reps lose deals. Every opportunity needs a next action, date, and reason.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nWrite three follow-up messages. Done means each has context, value, and a specific ask.\n\n## Practical Checkpoint\nDo not send “just checking in.” Bring value: mockup status, deadline reminder, store launch plan, or roster question.\n', 85, 'MODULE'),
  module(1121, 'LEVEL_4_SALES', 6, 'Moving from Interest to Closed Won', 'Closed Won requires decision, scope, price, timeline, and handoff clarity. Do not mark a deal won because someone sounded interested.', '## Training Explanation\nClosed Won requires decision, scope, price, timeline, and handoff clarity. Do not mark a deal won because someone sounded interested.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Closed Won checklist. Done means you can explain what happens to orders after Closed Won.\n\n## Practical Checkpoint\nConfirm package, quantities, approval, payment/order path, production needs, and delivery expectation.\n', 85, 'MODULE'),
  module(1122, 'LEVEL_5_EXPANSION', 1, 'Dashboard Basics', 'Dashboard metrics show what needs action: assigned schools, touched/untouched accounts, active opportunities, follow-ups, paid orders, ', '## Training Explanation\nDashboard metrics show what needs action: assigned schools, touched/untouched accounts, active opportunities, follow-ups, paid orders, and pacing.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nReview your dashboard. Done means you can name the top three accounts needing action.\n\n## Practical Checkpoint\nUse the dashboard every morning to choose action, not to admire numbers.\n', 85, 'MODULE'),
  module(1123, 'LEVEL_5_EXPANSION', 2, 'Organizations and Contacts', 'Organizations hold schools, clubs, and account data. Contacts hold the people who move decisions.', '## Training Explanation\nOrganizations hold schools, clubs, and account data. Contacts hold the people who move decisions.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nUpdate one organization/contact record. Done means another rep or director could understand the account from your notes.\n\n## Practical Checkpoint\nKeep names, roles, emails, phone numbers, sports, and notes clean.\n', 85, 'MODULE'),
  module(1124, 'LEVEL_5_EXPANSION', 3, 'Opportunities and Stages', 'Opportunities track real commercial movement. Stage changes must reflect buyer progress, not rep optimism.', '## Training Explanation\nOpportunities track real commercial movement. Stage changes must reflect buyer progress, not rep optimism.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nCreate or review one opportunity. Done means stage, value, next action, and buyer are clear.\n\n## Practical Checkpoint\nCreate opportunities only when there is a specific sport/product need and next step.\n', 85, 'MODULE'),
  module(1125, 'LEVEL_5_EXPANSION', 4, 'Orders After Closed Won', 'Closed Won should create an order handoff with assigned rep/director visibility. Orders are where production and payment reality begin.', '## Training Explanation\nClosed Won should create an order handoff with assigned rep/director visibility. Orders are where production and payment reality begin.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nExplain the handoff from opportunity to order. Done means you can state why unpaid/draft orders do not create payable commission.\n\n## Practical Checkpoint\nConfirm order details, missing information, payment status, and production blockers.\n', 85, 'MODULE'),
  module(1126, 'LEVEL_5_EXPANSION', 5, 'Commission Basics and Payment-Gated Earnings', 'Commissions are server-side and payment/fulfillment gated. Reps should care about clean order completion, not just verbal wins.', '## Training Explanation\nCommissions are server-side and payment/fulfillment gated. Reps should care about clean order completion, not just verbal wins.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nReview the earnings page. Done means you can explain paid order count, estimated commission, and why director override is not rep-visible.\n\n## Practical Checkpoint\nTrack delivered/completed orders and understand that unpaid/draft work is not payable commission.\n', 85, 'MODULE'),
  module(1127, 'SPECIALIZED_TRACKS', 1, 'Football', 'Football selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', '## Training Explanation\nFootball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Football mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1128, 'SPECIALIZED_TRACKS', 2, 'Basketball', 'Basketball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the spor', '## Training Explanation\nBasketball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Basketball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1129, 'SPECIALIZED_TRACKS', 3, 'Baseball', 'Baseball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', '## Training Explanation\nBaseball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Baseball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1130, 'SPECIALIZED_TRACKS', 4, 'Volleyball', 'Volleyball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the spor', '## Training Explanation\nVolleyball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Volleyball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1131, 'SPECIALIZED_TRACKS', 5, 'Women’s Sports', 'Women’s Sports selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the ', '## Training Explanation\nWomen’s Sports selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Women’s Sports mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1132, 'SPECIALIZED_TRACKS', 6, '7v7/Flag', '7v7/Flag selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', '## Training Explanation\n7v7/Flag selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a 7v7/Flag mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1133, 'SPECIALIZED_TRACKS', 7, 'Youth Programs', 'Youth Programs selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the ', '## Training Explanation\nYouth Programs selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Youth Programs mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1134, 'SPECIALIZED_TRACKS', 8, 'Letterman Jacket Campaigns', 'Letterman Jacket Campaigns selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF p', '## Training Explanation\nLetterman Jacket Campaigns selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a Letterman Jacket Campaigns mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.\n\n## Practical Checkpoint\nStudy the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.\n', 85, 'HANDS_ON'),
  module(1135, 'LEVEL_7_DIRECTOR', 1, 'Director Certification Review', 'Directors certify reps by verifying modules, HR docs, practical simulator exercise, and readiness for live CRM access.', '## Training Explanation\nDirectors certify reps by verifying modules, HR docs, practical simulator exercise, and readiness for live CRM access.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nReview one rep checklist. Done means director can justify sign-off or identify the exact blocker.\n\n## Practical Checkpoint\nPrimeau/directors should coach calls, inspect CRM discipline, and only sign off when a rep can sell responsibly.\n', 85, 'MODULE'),
  module(1136, 'MARKET_MASTERY', 1, 'Minnesota Launch Market Mastery', 'Minnesota launch reps must understand school seasonality, football/basketball/baseball opportunities, hockey pockets, youth feeders, an', '## Training Explanation\nMinnesota launch reps must understand school seasonality, football/basketball/baseball opportunities, hockey pockets, youth feeders, and booster influence.\n\n## Rep Actions\n- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.\n- Ask one direct diagnostic question before pitching product.\n- Log every real call, email, text, meeting, note, opportunity activity, or contact.\n- Create a dated follow-up before ending the work block.\n\n## Field Language\n"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."\n\n## What Done Means\nBuild a 30-day Minnesota territory attack plan. Done means it names schools, sports, feeder targets, and weekly action volume.\n\n## Practical Checkpoint\nPrioritize assigned schools by season and likelihood. Combine school, feeder, and travel opportunities into one territory plan.\n', 85, 'MODULE'),
];

function getCurrentTrainingRole() {
  try {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (!raw) return 'REP';
    const parsed = JSON.parse(raw);
    return parsed.role || 'REP';
  } catch {
    return 'REP';
  }
}

function buildDefaultEnrollment(userId: number, role = getCurrentTrainingRole()): TrainingEnrollmentWithProgress {
  const now = new Date().toISOString();
  const modules = DEFAULT_TRAINING_MODULES.map(module => ({
    ...module,
    role,
    created_at: now,
    updated_at: now,
  }));
  const phases = ACADEMY_PHASES;
  const phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }> = {};
  phases.forEach(phase => {
    phaseCompletionStatus[phase] = {
      completed: 0,
      total: modules.filter(module => module.phase === phase).length,
      percentComplete: 0,
    };
  });

  return {
    enrollment: {
      id: userId,
      user_id: userId,
      role,
      status: 'ACTIVE',
      current_phase: 'LEVEL_1_OPERATOR',
      enrolled_at: now,
      created_at: now,
      updated_at: now,
    },
    modules,
    progress: [],
    completionMetrics: {
      totalModules: modules.length,
      completedModules: 0,
      percentComplete: 0,
      phaseCompletionStatus,
    },
  };
}

export function useTrainingEnrollment(userId: number) {
  const [enrollment, setEnrollment] = useState<TrainingEnrollmentWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        let response = await fetch(`${TRAINING_API_BASE_URL}/enrollment?userId=${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            const userRaw = localStorage.getItem('tuf_ops_user_v3');
            const userObj = userRaw ? JSON.parse(userRaw) : null;
            const role = userObj?.role || 'REP';
            
            const enrollResponse = await fetch(`${TRAINING_API_BASE_URL}/enrollment/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, role })
            });
            if (enrollResponse.ok) {
              response = await fetch(`${TRAINING_API_BASE_URL}/enrollment?userId=${userId}`);
              if (!response.ok) {
                throw new Error('Failed to fetch enrollment after auto-enrolling');
              }
            } else {
              throw new Error('Failed to auto-enroll user');
            }
          } else {
            throw new Error('Failed to fetch enrollment');
          }
        }
        const data = await response.json();
        setEnrollment(data);
        localStorage.setItem(`tuf_ops_training_v1_${userId}`, JSON.stringify(data));
      } catch (err) {
        const cached = localStorage.getItem(`tuf_ops_training_v1_${userId}`);
        if (cached) {
          setEnrollment(JSON.parse(cached));
        } else {
          const fallbackEnrollment = buildDefaultEnrollment(userId);
          setEnrollment(fallbackEnrollment);
          localStorage.setItem(`tuf_ops_training_v1_${userId}`, JSON.stringify(fallbackEnrollment));
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEnrollment();
    }
  }, [userId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TrainingEnrollmentWithProgress>;
      if (customEvent.detail && customEvent.detail.enrollment.user_id === userId) {
        setEnrollment(customEvent.detail);
      }
    };
    window.addEventListener('tuf:training-updated', handleUpdate);
    return () => window.removeEventListener('tuf:training-updated', handleUpdate);
  }, [userId]);

  return { enrollment, loading, error };
}

export function useTrainingModule(moduleId: number, enrollmentId: number) {
  const [moduleData, setModuleData] = useState<{ module: TrainingModule; progress: TrainingProgress | undefined } | null>(null);
  const [loading, setLoading] = useState(false);

  const getUserIdFromLocalStorage = () => {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (!raw) return 21; // fallback
    try {
      const parsed = JSON.parse(raw);
      return parseInt(parsed.id.replace('u-local-', '').replace('u-rep-', '').replace('u-director-', ''), 10) || 21;
    } catch {
      return 21;
    }
  };

  const updateLocalProgress = (modId: number, status: 'IN_PROGRESS' | 'COMPLETED', timeSpentSeconds?: number) => {
    const userId = getUserIdFromLocalStorage();
    const cacheKey = `tuf_ops_training_v1_${userId}`;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as TrainingEnrollmentWithProgress;
      
      let progressRow = data.progress.find(p => p.module_id === modId);
      if (!progressRow) {
        progressRow = {
          id: Date.now(),
          enrollment_id: data.enrollment.id,
          module_id: modId,
          status,
          time_spent_seconds: timeSpentSeconds || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.progress.push(progressRow);
      } else {
        progressRow.status = status;
        if (timeSpentSeconds !== undefined) {
          progressRow.time_spent_seconds = timeSpentSeconds;
        }
        progressRow.updated_at = new Date().toISOString();
        if (status === 'COMPLETED') {
          progressRow.completed_at = new Date().toISOString();
        }
      }
      
      const completed = data.progress.filter(p => p.status === 'COMPLETED');
      const completedIds = new Set(completed.map(c => c.module_id));
      const completedModules = data.modules.filter(m => completedIds.has(m.id)).length;
      const totalModules = data.modules.length;
      const percentComplete = Math.round((completedModules / totalModules) * 100) || 0;
      
      const phases = ACADEMY_PHASES;
      const phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }> = {};
      phases.forEach(p => {
        const phaseModules = data.modules.filter(m => m.phase === p);
        const phaseCompleted = phaseModules.filter(m => completedIds.has(m.id)).length;
        const phaseTotal = phaseModules.length;
        phaseCompletionStatus[p] = {
          completed: phaseCompleted,
          total: phaseTotal,
          percentComplete: Math.round((phaseCompleted / phaseTotal) * 100) || 0
        };
      });
      
      if (percentComplete === 100) {
        data.enrollment.status = 'COMPLETED';
        data.enrollment.completed_at = new Date().toISOString();
        
        const userRaw = localStorage.getItem('tuf_ops_user_v3');
        if (userRaw) {
          const userObj = JSON.parse(userRaw);
          if (userObj.role === 'REP') {
            const hrDocsCompleted = userObj.hrDocsCompleted || false;
            const directorSignedOff = userObj.directorSignedOff || false;
            const practicalExerciseCompleted = userObj.practicalExerciseCompleted || false;
            userObj.isCertified = hrDocsCompleted && practicalExerciseCompleted && directorSignedOff;
            localStorage.setItem('tuf_ops_user_v3', JSON.stringify(userObj));
            window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: userObj }));
          }
        }
      }
      
      data.completionMetrics = {
        totalModules,
        completedModules,
        percentComplete,
        phaseCompletionStatus
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('tuf:training-updated', { detail: data }));
    } catch (e) {
      console.error('Failed to update local progress:', e);
    }
  };

  const startModule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${TRAINING_API_BASE_URL}/progress/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, moduleId }),
      });
      if (!response.ok) throw new Error('Failed to start module');
      return await response.json();
    } catch (err) {
      console.warn('API connection failed, updating LocalStorage offline:', err);
      updateLocalProgress(moduleId, 'IN_PROGRESS');
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  const completeModule = async (timeSpentSeconds?: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${TRAINING_API_BASE_URL}/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, moduleId, timeSpentSeconds }),
      });
      if (!response.ok) throw new Error('Failed to complete module');
      return await response.json();
    } catch (err) {
      console.warn('API connection failed, updating LocalStorage offline:', err);
      updateLocalProgress(moduleId, 'COMPLETED', timeSpentSeconds);
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (answers: string[]) => {
    try {
      setLoading(true);
      const response = await fetch(`${TRAINING_API_BASE_URL}/assessments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, moduleId, answers }),
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return await response.json();
    } catch (err) {
      if (IS_PRODUCTION) throw err;
      const raw = localStorage.getItem(`tuf_ops_training_v1_${getUserIdFromLocalStorage()}`);
      const data = raw ? JSON.parse(raw) as TrainingEnrollmentWithProgress : null;
      const quizModule = data?.modules.find((module) => module.id === moduleId);
      const questions = quizModule?.quiz_json || [];
      const correct = questions.reduce((sum, question, index) => sum + (answers[index] === question.correctAnswer ? 1 : 0), 0);
      const score = questions.length ? Math.round((correct / questions.length) * 100) : 100;
      return { score, passed: score >= (quizModule?.passing_score || 85), offline: true };
    } finally {
      setLoading(false);
    }
  };

  return { moduleData, loading, startModule, completeModule, submitQuiz };
}
