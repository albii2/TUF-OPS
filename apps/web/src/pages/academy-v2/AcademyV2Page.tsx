// Force bundle inclusion — do not tree-shake
(window as any).__ACADEMY_V3_LOADED__ = true;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStoredUser } from '../../auth';

// ─── Types ────────────────────────────────────────────────────────

interface QuizDef {
  quizId: string;
  name: string;
  questionCount: number;
}

interface Phase1QuizStatus {
  quizId: string;
  name: string;
  score: number | null;
  passed: boolean;
  attemptedAt: string | null;
}

interface WalkthroughStep {
  stepId: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
}

interface SandboxOrg {
  id: number;
  name: string;
  website: string | null;
  physical_address: string | null;
  enrollment: number | null;
  sports_programs: string[];
  current_provider: string | null;
  research_notes: string | null;
  source_url: string | null;
  lead_status: string;
}

interface SandboxContact {
  id: number;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  source_citation: string | null;
}

interface SandboxOpportunity {
  id: number;
  name: string;
  estimated_value: number;
  target_close_date: string | null;
  lane: string;
  stage: string;
  sport: string | null;
  notes: string | null;
}

interface SandboxActivity {
  id: number;
  activity_type: string;
  description: string | null;
  notes: string | null;
  template_used: string | null;
  scheduled_at: string;
}

interface SalesExecution {
  id: number;
  execution_type: string;
  notes: string;
  objection_handled: string | null;
  score: number | null;
}

interface LeadTaxonomy {
  id: number;
  lead_name: string;
  lead_status: string;
  claimed_by: number | null;
}

interface GraduationGates {
  orgs: { current: number; required: number; met: boolean };
  contacts: { current: number; required: number; met: boolean };
  opps: { current: number; required: number; met: boolean };
  activities: { current: number; required: number; met: boolean };
  sales_executions: { current: number; required: number; met: boolean };
  directorApproved: { met: boolean };
}

interface GraduationStatus {
  phase1: { completed: boolean };
  phase2: { completed: boolean };
  phase3: { completed: boolean };
  phase4: { completed: boolean };
  phase5: { completed: boolean };
  gates: GraduationGates;
  all_passed: boolean;
  ready_to_graduate: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────

const API_BASE = '/api/v1/academy-v2';

const PHASE_1_QUIZZES: QuizDef[] = [
  { quizId: 'philosophy', name: 'TUF Philosophy & Sales Principles', questionCount: 10 },
  { quizId: 'prospecting', name: 'Prospecting & Territory Awareness', questionCount: 10 },
  { quizId: 'discovery', name: 'Discovery & Needs Analysis', questionCount: 10 },
  { quizId: 'proposal', name: 'Proposal Building & Pricing', questionCount: 10 },
  { quizId: 'order_handoff', name: 'Order Handoff & Closed Won Standard', questionCount: 10 },
  { quizId: 'product_knowledge', name: 'Product Knowledge & Collections', questionCount: 10 },
  { quizId: 'pipeline_accelerator', name: 'Pipeline Accelerator & Tactics', questionCount: 10 },
];

const WALKTHROUGH_STEPS = [
  { stepId: 'dashboard_overview', label: 'Dashboard Overview', description: 'Navigate the Command Center and understand key metrics' },
  { stepId: 'organizations_list', label: 'Organizations List', description: 'Browse and search existing organizations in the CRM' },
  { stepId: 'org_detail', label: 'Organization Detail', description: 'View a full organization profile with contacts, opps, and activities' },
  { stepId: 'pipeline_view', label: 'Pipeline View', description: 'Understand the opportunity board and pipeline stages' },
  { stepId: 'opp_detail', label: 'Opportunity Detail', description: 'Explore opportunity fields: value, stage, next actions' },
  { stepId: 'activities_log', label: 'Activities Log', description: 'View logged activities and understand activity tracking' },
  { stepId: 'territory_map', label: 'Territory Map', description: 'Explore territory assignment and account distribution' },
  { stepId: 'orders_view', label: 'Orders View', description: 'Understand the order lifecycle and fulfillment flow' },
];

const LANES = ['Uniforms', 'Travel Gear', 'Team Store', 'Letterman'];
const STAGES = ['LEAD', 'LEAD_ENGAGED', 'CONTACTED', 'DISCOVERY', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

type Tab = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'graduation' | 'leads';

// ─── Helper ────────────────────────────────────────────────────────

async function apiFetch(path: string, options?: RequestInit) {
  const user = getStoredUser();
  const token = localStorage.getItem('tuf_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AcademyV2Page() {
  const user = getStoredUser();
  const userId = user?.id ? Number(user.id) : 1;
  const [tab, setTab] = useState<Tab>('phase1');

  return (
    <div className="min-h-screen bg-[#070c13] text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-[#0a1220] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-white">TUF Academy v3</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sandbox-Based Training • 5 Phases • Quality-Gated Certification
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 bg-[#0a1220]">
        <div className="max-w-7xl mx-auto flex gap-0 overflow-x-auto">
          {([
            ['phase1', '🧠 Phase 1: Foundations'],
            ['phase2', '🗺️ Phase 2: CRM Walkthrough'],
            ['phase3', '🏗️ Phase 3: Sandbox Territory'],
            ['phase4', '💰 Phase 4: Sales Execution'],
            ['leads', '📋 Lead Taxonomy'],
            ['graduation', '🎓 Graduation'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto p-6">
        {tab === 'phase1' && <Phase1Tab userId={userId} />}
        {tab === 'phase2' && <Phase2Tab userId={userId} />}
        {tab === 'phase3' && <Phase3Tab userId={userId} />}
        {tab === 'phase4' && <Phase4Tab userId={userId} />}
        {tab === 'leads' && <LeadsTab userId={userId} />}
        {tab === 'graduation' && <GraduationTab userId={userId} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1: Foundations (Quizzes Only)
// ═══════════════════════════════════════════════════════════════════

function Phase1Tab({ userId }: { userId: number }) {
  const [quizStatuses, setQuizStatuses] = useState<Phase1QuizStatus[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/phase1-status?userId=${userId}`)
      .then((data: any) => setQuizStatuses(data.quizzes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const allPassed = quizStatuses.length > 0 && quizStatuses.every((q) => q.passed);
  const passedCount = quizStatuses.filter((q) => q.passed).length;

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-emerald-300">Phase 1: Foundations</h2>
        <p className="text-sm text-slate-400 mt-1">
          Knowledge-based quizzes only. No CRM access required. Master the TUF Sales Philosophy, Product
          Knowledge, Territory Awareness, and Pipeline fundamentals before touching the CRM.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">Progress: </span>
            <span className="font-bold text-white">{passedCount}/{PHASE_1_QUIZZES.length} quizzes passed</span>
          </div>
          {allPassed && (
            <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-1 rounded font-bold">
              ✓ PHASE COMPLETE
            </span>
          )}
        </div>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PHASE_1_QUIZZES.map((quiz) => {
          const status = quizStatuses.find((s) => s.quizId === quiz.quizId);
          const passed = status?.passed ?? false;

          return (
            <div
              key={quiz.quizId}
              className={`border rounded-lg p-4 transition-colors ${
                passed
                  ? 'border-emerald-400/30 bg-emerald-400/5'
                  : status
                  ? 'border-amber-400/30 bg-amber-400/5'
                  : 'border-slate-700 bg-slate-800/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white">{quiz.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{quiz.questionCount} questions · Pass: 80%</p>
                  {status && (
                    <p className="text-xs mt-1">
                      {passed ? (
                        <span className="text-emerald-300">Passed ({status.score}%)</span>
                      ) : (
                        <span className="text-amber-300">Attempted: {status.score}% (need 80%)</span>
                      )}
                    </p>
                  )}
                </div>
                <span className={`text-2xl ${passed ? 'text-emerald-400' : status ? 'text-amber-400' : 'text-slate-600'}`}>
                  {passed ? '✓' : status ? '↻' : '○'}
                </span>
              </div>
              <button
                onClick={() => setActiveQuiz(quiz.quizId)}
                className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600 transition-colors"
              >
                {passed ? 'Retake Quiz' : (status && status.attemptedAt) ? 'Retry Quiz' : 'Take Quiz'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quiz Modal (simplified) */}
      {activeQuiz && (
        <QuizModal
          quizId={activeQuiz}
          userId={userId}
          onClose={() => setActiveQuiz(null)}
          onComplete={() => {
            setActiveQuiz(null);
            // Refresh
            apiFetch(`/phase1-status?userId=${userId}`)
              .then((data: any) => setQuizStatuses(data.quizzes || []))
              .catch(console.error);
          }}
        />
      )}
    </div>
  );
}

// ─── Simple Quiz Modal ─────────────────────────────────────────────

function QuizModal({
  quizId,
  userId,
  onClose,
  onComplete,
}: {
  quizId: string;
  userId: number;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Sample questions (simplified - uses existing quiz data patterns)
  const questions = useMemo(() => {
    // Generate 5 questions based on quiz topic
    const bank: Record<string, { question: string; options: string[]; correct: number }[]> = {
      philosophy: [
        { question: 'Why does TUF exist?', options: [
          'To absorb the uniform/apparel burden so coaches can focus on athletes',
          'To manufacture the cheapest team uniforms available',
          'To outsource athletic department purchasing',
          'To compete with national retailers on style',
        ], correct: 0 },
        { question: 'What is the four-order baseline?', options: [
          'Four healthy orders per month, every month — consistency over size',
          'Four quotes per week to maintain pipeline velocity',
          'Four orders max any rep can manage at one time',
          'Only four largest programs generate meaningful revenue',
        ], correct: 0 },
        { question: 'What are the four revenue lanes?', options: [
          'Uniforms, Travel Gear, Team Stores, Letterman Jackets',
          'Football, Basketball, Baseball, Soccer',
          'Jerseys, Pants, Shorts, Jackets',
          'Varsity, JV, Freshman, Middle School',
        ], correct: 0 },
        { question: 'What does "We sell trust before apparel" mean?', options: [
          'Coaches buy from people they trust — build relationships first',
          'We give free samples before asking for orders',
          'Trust is optional — product quality sells itself',
          'Only sell to coaches you already know',
        ], correct: 0 },
        { question: 'A rep at 23% account penetration means:', options: [
          '37 untapped revenue opportunities exist in accounts they already serve',
          'The account is underperforming and should be dropped',
          'They have captured the majority of available revenue',
          'They need more accounts, not more lanes',
        ], correct: 0 },
        { question: 'What is the 7 Sales Philosophy principle about "activity"?', options: [
          'Activity creates opportunity — volume of quality outreach is the leading indicator',
          'Only call when you have a new product to pitch',
          'Send emails in bulk to save time',
          'Wait for coaches to contact you first',
        ], correct: 0 },
        { question: 'A Director runs territory health every Monday. Which metric matters most?', options: [
          'Account coverage — percentage of assigned accounts with real activity',
          'Total revenue closed this month',
          'Number of reps on the team',
          'How many vendors are in rotation',
        ], correct: 0 },
        { question: 'What defines a "healthy pipeline" for a TAE?', options: [
          'At least 4 active opportunities at different stages, progressing weekly',
          'Having the most opportunities of anyone on the team',
          'One very large deal that will close eventually',
          'Waiting for the Director to assign more leads',
        ], correct: 0 },
        { question: 'You discover a coach already has a vendor. What do you say?', options: [
          '"Coach, I would love the chance to earn a spot in your rotation — not replace anyone, just compete."',
          '"Our prices are lower — switch immediately."',
          '"Your current provider is overcharging you."',
          'Move on to the next school without engaging.',
        ], correct: 0 },
        { question: 'Lane penetration is defined as:', options: [
          'The percentage of an account revenue lanes that are active — it is the leading indicator of account health',
          'Having at least one order in every sport at every school',
          'The total dollar value of all active opportunities',
          'The number of accounts assigned per territory zone',
        ], correct: 0 },
      ],
      prospecting: [
        { question: 'What is the first step in prospecting?', options: [
          'Identify target programs using enrollment data, sports offered, and existing provider gaps',
          'Call every school in the territory alphabetically',
          'Wait for the Director to assign leads',
          'Post on social media and wait for responses',
        ], correct: 0 },
        { question: 'What makes a school a "high-value target"?', options: [
          'Large enrollment, multiple sports, known uniform replacement cycle, no incumbent contract',
          'Any school within 10 miles of your home',
          'Schools that have emailed TUF before',
          'Only Division I college programs',
        ], correct: 0 },
        { question: 'How should you research a school before first contact?', options: [
          'Check the school website, MaxPreps schedule, coaching staff directory, and current uniform photos',
          'Ask the Director for a complete dossier',
          'Wait until you have a full list of 50 schools',
          'Skip research — cold calls work better',
        ], correct: 0 },
        { question: 'What is the ideal first contact method?', options: [
          'Phone call to the Athletic Director — introduce yourself as a resource, not a salesperson',
          'Mass email to every coach at the school',
          'Drop in unannounced during practice',
          'Send a catalog with no personal note',
        ], correct: 0 },
        { question: 'When is the best time to contact a high school AD?', options: [
          'Tuesday through Thursday between 9am and 2pm — avoid game days and after-school chaos',
          'Monday at 7am sharp',
          'Friday after 4pm when they are wrapping up',
          'Weekends when they have free time',
        ], correct: 0 },
        { question: 'A coach says "We are happy with our current provider." Your move:', options: [
          '"I respect that. May I ask when your contract renews so I can follow up then?"',
          '"You are probably overpaying — let me show you our prices."',
          'Accept it and never contact them again',
          'Tell them their provider has quality issues',
        ], correct: 0 },
        { question: 'What is territory awareness?', options: [
          'Knowing every school in your assigned region — their sports, decision-makers, and buying cycles',
          'Memorizing all ZIP codes in the state',
          'Tracking competitors who are also selling in the region',
          'Knowing which schools generate the most revenue this month only',
        ], correct: 0 },
        { question: 'How many schools should you research before starting outreach?', options: [
          'At least 10-15 to have a pipeline buffer, but start calling after 5 are researched',
          'All 296 assigned before making a single call',
          'One at a time — research, call, close, repeat',
          'None — figure it out during the call',
        ], correct: 0 },
        { question: 'What is a "warm lead"?', options: [
          'A school where you have a referral, previous contact, or existing relationship',
          'Any school in a warm climate',
          'A lead the Director pre-approved',
          'Schools that opened your email once',
        ], correct: 0 },
        { question: 'You research a school and discover they have football, basketball, and volleyball. What do you do?', options: [
          'Map all three sports — each is a potential revenue lane. Start with the sport closest to season',
          'Only contact the football coach since football generates the most revenue',
          'Send one general email to the AD mentioning all sports',
          'Wait until you know which sport has the biggest budget',
        ], correct: 0 },
      ],
      discovery: [
        { question: 'What is the goal of a discovery call?', options: [
          'Uncover needs, identify decision-makers, map the program spend, and determine the buying timeline',
          'Close the deal on the first call',
          'Send the price list as fast as possible',
          'Tell the coach everything TUF offers',
        ], correct: 0 },
        { question: 'What is the most important question to ask in discovery?', options: [
          '"Walk me through your current uniform ordering process — what is working and what is not?"',
          '"What is your budget?"',
          '"Can I send you a quote?"',
          '"Do you have 5 minutes to talk?"',
        ], correct: 0 },
        { question: 'A coach mentions they order uniforms every 2 years. What does this tell you?', options: [
          'The buying cycle is biennial — time your follow-up to align with their replacement window',
          'They do not need uniforms this year',
          'They have no budget',
          'They are not a serious prospect',
        ], correct: 0 },
        { question: 'What are the four revenue lanes you should assess during discovery?', options: [
          'Uniforms, Travel Gear, Team Store, Letterman Jackets',
          'Football, Basketball, Baseball, Track',
          'Jerseys, Shorts, Warm-ups, Bags',
          'Varsity, JV, Freshman, Youth',
        ], correct: 0 },
        { question: 'The AD tells you they spend about $15K/year on uniforms across 3 sports. What do you say?', options: [
          '"Great baseline. Most programs I work with find they can consolidate to get better pricing, and I would love to show you what that looks like."',
          '"That is too low — we only work with programs spending $25K+."',
          '"I can beat that price by 20%."',
          '"Let me send you a catalog."',
        ], correct: 0 },
        { question: 'During discovery, who should you try to speak with besides the AD?', options: [
          'Head coaches of the largest programs — they influence purchasing decisions and know specific needs',
          'Only the AD — coaches do not make purchasing decisions',
          'The school principal — they control the entire budget',
          'Students — they know what they want to wear',
        ], correct: 0 },
        { question: 'A coach says "We do not have a budget for new uniforms this year." Your response:', options: [
          '"Understood. Many programs I work with start planning 12-18 months out. Would it help if I sent you samples to review at no obligation?"',
          '"That is unfortunate — call me when you do."',
          '"Are you sure? Let me check your budget myself."',
          '"I can offer financing."',
        ], correct: 0 },
        { question: 'What information must you capture from every discovery conversation?', options: [
          'Decision-maker name and role, sports programs, current provider, buying timeline, uniform replacement cycle, and any pain points',
          'Just the coach name and phone number',
          'Budget amount only',
          'Whether they want a quote or not',
        ], correct: 0 },
        { question: 'What is a "lane gap"?', options: [
          'A sports program at a school that does not have an active TUF opportunity — an untapped revenue source',
          'A missing piece of data in the CRM',
          'A road between two schools in your territory',
          'A coach who changed jobs',
        ], correct: 0 },
        { question: 'After discovery, what should you do within 24 hours?', options: [
          'Send a personalized follow-up email summarizing the conversation with next steps clearly stated',
          'Wait a week before following up',
          'Send a generic quote template',
          'Call the coach again to check if they changed their mind',
        ], correct: 0 },
      ],
      proposal: [
        { question: 'What should every proposal include?', options: [
          'Itemized pricing, delivery timeline, mockup/design reference, payment terms, and a clear call to action',
          'Just the total price',
          'A link to the TUF website',
          'Only the product name and quantity',
        ], correct: 0 },
        { question: 'When should you present pricing to a coach?', options: [
          'After you understand their needs, have shown the product quality, and they have expressed interest in moving forward',
          'On the first call before anything else',
          'Only after they ask for it three times',
          'Never — let them find it on the website',
        ], correct: 0 },
        { question: 'A coach objects to the price. Your response:', options: [
          '"I understand the budget concern. Let us look at which items are must-haves vs. nice-to-haves — we can phase the order over two seasons."',
          '"Our prices are non-negotiable."',
          '"I will ask my manager for a discount."',
          '"You get what you pay for."',
        ], correct: 0 },
        { question: 'What is the TUF GRIND fabric advantage?', options: [
          'Engineered durability that reduces replacement frequency — lower cost per wear over the garment life',
          'The cheapest fabric on the market',
          'Lighter weight than all competitors',
          'Available in more colors than any other brand',
        ], correct: 0 },
        { question: 'How do you handle a coach who wants a competitor quote matched?', options: [
          '"Let me understand what you value most — if it is price alone, I may not be the right fit. If it is quality and service, let me show you why programs stay with TUF."',
          'Match the price immediately',
          'Tell them the competitor product is inferior',
          'Walk away from the deal',
        ], correct: 0 },
        { question: 'What is the minimum viable proposal turnaround time?', options: [
          '24-48 hours after receiving all specs — speed signals that you value their time',
          'Same day, no matter what',
          'One week — proposals take time to perfect',
          'Whenever you get around to it',
        ], correct: 0 },
        { question: 'A coach asks for a discount because they are ordering for three sports. Your response:', options: [
          '"Multi-sport programs are exactly the type of partner we invest in — I can offer volume pricing across the total order."',
          '"Discounts are only for orders over $50K."',
          '"No discounts — the price is the price."',
          '"I will have to check with my manager and get back to you next week."',
        ], correct: 0 },
        { question: 'What payment terms does TUF typically offer?', options: [
          'Net 30 on approved credit, with 50% down on first orders',
          'Payment in full before production starts for every order',
          'Net 90 with no deposit',
          'Cash only',
        ], correct: 0 },
        { question: 'How do you present a mockup alongside a proposal?', options: [
          'Show the mockup first — let the design sell itself. Then walk through the investment as an investment in their program identity.',
          'Send the price first, mockup second',
          'Do not include mockups — they distract from pricing',
          'Only show mockups after the deal is closed',
        ], correct: 0 },
        { question: 'After sending a proposal, what is your follow-up cadence?', options: [
          'Day 1: confirmation email. Day 3: check-in call. Day 7: final follow-up with a deadline.',
          'Wait two weeks and call once',
          'Text them every day until they respond',
          'Assume no response means no and move on',
        ], correct: 0 },
      ],
      order_handoff: [
        { question: 'What triggers the Order Handoff stage?', options: [
          'Invoice is sent and payment terms are accepted by the coach or AD',
          'When the coach verbally says yes',
          'When production starts manufacturing',
          'When the mockup is approved',
        ], correct: 0 },
        { question: 'What must be confirmed before handing an order to operations?', options: [
          'Final quantities, sizes, artwork approval, delivery address, and payment confirmation',
          'Only the coach name',
          'Just the total price',
          'The coach email address',
        ], correct: 0 },
        { question: 'A coach approves the order but then wants to change quantities. Your response:', options: [
          '"I can modify the order if production has not started. Let me confirm the status and adjust for you."',
          '"Sorry, no changes after approval."',
          '"You will need to place a second order."',
          'Ignore the request and ship the original quantities',
        ], correct: 0 },
        { question: 'What is the Closed Won Standard?', options: [
          'Payment confirmed, order submitted to production, delivery timeline communicated, and next-season calendar invite sent',
          'The coach said yes verbally',
          'The invoice was emailed',
          'Production started manufacturing',
        ], correct: 0 },
        { question: 'When should you discuss the next order with a coach?', options: [
          'At delivery — ask about next season needs while the excitement of the new gear is fresh',
          'Never — wait for them to reach out',
          'Six months after delivery',
          'Only if they mention it first',
        ], correct: 0 },
        { question: 'What is a "reorder trigger"?', options: [
          'A scheduled follow-up aligned with the program buying cycle — spring for fall sports, summer for winter sports',
          'Any time the coach calls you',
          'When inventory runs out',
          'Every January regardless',
        ], correct: 0 },
        { question: 'An order arrives with a quality issue. What do you do?', options: [
          'Apologize sincerely, document the issue with photos, escalate to production immediately, and give the coach a timeline for resolution',
          'Blame the vendor',
          'Offer a discount on the next order only',
          'Tell the coach to return it themselves',
        ], correct: 0 },
        { question: 'How many orders per month defines a TAE hitting the floor?', options: [
          '4 orders per month — the four-order baseline',
          '10 orders per month',
          '1 large order per month',
          'As many as possible',
        ], correct: 0 },
        { question: 'After closing an order, what should you log in the CRM?', options: [
          'Final order value, delivery date, coach feedback, and a scheduled re-engagement date for next season',
          'Only the invoice number',
          'Nothing — the deal is done',
          'Just mark it as CLOSED_WON',
        ], correct: 0 },
        { question: 'A coach asks if they can pay after delivery. Your response:', options: [
          '"Our standard terms require payment before production begins to secure your spot in the manufacturing queue. I can split the invoice if that helps with your budget cycle."',
          '"Absolutely, pay whenever."',
          '"No — we require full payment upfront, no exceptions."',
          'Ghost them until they pay',
        ], correct: 0 },
      ],
      product_knowledge: [
        { question: 'What is TUF GRIND fabric?', options: [
          'A proprietary performance fabric engineered for durability, moisture-wicking, and four-way stretch — built for contact sports',
          'A cheap cotton alternative',
          'A competitor fabric we resell',
          'Polyester with a different name',
        ], correct: 0 },
        { question: 'Which sports benefit most from TUF GRIND technology?', options: [
          'Football, lacrosse, and hockey — high-contact sports where fabric durability prevents tearing and extends garment life',
          'Golf and tennis only',
          'Track and cross country',
          'All sports equally',
        ], correct: 0 },
        { question: 'What customization options does TUF offer?', options: [
          'Sublimated designs, screen printing, embroidery, tackle twill, heat press, and custom color matching',
          'Only screen printing',
          'Only embroidery',
          'Pre-made stock designs only',
        ], correct: 0 },
        { question: 'What is the minimum order quantity for custom uniforms?', options: [
          '12 units per style — designed to accommodate small programs while maintaining production efficiency',
          '100 units',
          'No minimum',
          '500 units',
        ], correct: 0 },
        { question: 'What is the typical production timeline for a custom uniform order?', options: [
          '4-6 weeks from artwork approval to delivery, with 2 additional weeks for sublimation during peak season',
          '1 week',
          '3 months',
          'Same day',
        ], correct: 0 },
        { question: 'A coach wants a color TUF does not stock. What do you say?', options: [
          '"We can custom-match any Pantone color — I will send a swatch for your approval before production."',
          '"Sorry, we only have our standard colors."',
          '"Pick the closest match from our catalog."',
          '"That will cost double."',
        ], correct: 0 },
        { question: 'What is sublimation vs. screen printing?', options: [
          'Sublimation dyes the fabric at a molecular level — permanent, no cracking, unlimited colors. Screen printing applies ink on top of fabric.',
          'They are the same thing with different names',
          'Sublimation is cheaper than screen printing',
          'Screen printing lasts longer than sublimation',
        ], correct: 0 },
        { question: 'What are the four collections TUF offers?', options: [
          'TUF GRIND (football/lacrosse), TUF FLOW (basketball/volleyball), TUF BASE (baseball/softball), TUF ELITE (premium programs)',
          'Fall, Winter, Spring, Summer',
          'Budget, Standard, Premium, Elite',
          'Varsity, JV, Freshman, Youth',
        ], correct: 0 },
        { question: 'A coach asks about letterman jackets. What do you tell them?', options: [
          '"Letterman is our highest-margin lane — we offer custom wool/leather jackets with embroidery, patches, and senior personalization."',
          '"We do not do letterman."',
          '"Letterman is only for state champions."',
          '"That is a separate division — I will transfer you."',
        ], correct: 0 },
        { question: 'What fabric technology do you highlight for basketball uniforms?', options: [
          'TUF FLOW — ultra-lightweight moisture management with anti-microbial treatment to reduce odor buildup during tournament weekends',
          'The same as football — heavy duty GRIND fabric',
          'Standard cotton',
          'Whatever is cheapest',
        ], correct: 0 },
      ],
      pipeline_accelerator: [
        { question: 'What is the pipeline accelerator concept?', options: [
          'Every action should move an opportunity one stage forward — no activity is neutral. If you are not advancing, you are stalling.',
          'Call every lead every day',
          'Work faster than everyone else',
          'Automate all follow-ups',
        ], correct: 0 },
        { question: 'A deal has been stuck in DISCOVERY for 3 weeks. What do you do?', options: [
          '"Coach, I want to make sure I am not wasting your time. Is there a concern I have not addressed, or should we revisit this in the fall?"',
          'Wait another 3 weeks',
          'Send another generic follow-up email',
          'Give up and move on',
        ], correct: 0 },
        { question: 'What is the 24-hour rule after any client interaction?', options: [
          'Log the activity in the CRM, update the opportunity stage if applicable, and schedule the next touchpoint within 24 hours',
          'Wait 24 hours before doing anything',
          'Call the coach again within 24 hours',
          'Send an invoice within 24 hours',
        ], correct: 0 },
        { question: 'How do you prioritize your daily activities?', options: [
          'Revenue at risk first (stale deals, invoices pending), then near-close deals, then new outreach',
          'Alphabetically by school name',
          'Whichever coach emails you first',
          'Largest deals only — ignore small programs',
        ], correct: 0 },
        { question: 'What does "pipeline velocity" measure?', options: [
          'How quickly opportunities move from LEAD_ENGAGED to CLOSED_WON — the speed of your sales cycle',
          'The total value of all active opportunities',
          'The number of calls made per day',
          'How many schools are in your territory',
        ], correct: 0 },
        { question: 'What is the ideal pipeline stage distribution?', options: [
          '40% early stage (LEAD_ENGAGED/DISCOVERY), 35% mid (MOCKUP_STAGE), 20% late (INVOICE_SENT), 5% closed',
          '100% in CLOSED_WON',
          'Equal distribution across all stages',
          'Most deals in INVOICE_SENT',
        ], correct: 0 },
        { question: 'You have 12 opportunities but only 2 are advancing. What is the diagnosis?', options: [
          'Stalled pipeline — you are opening deals but not closing them. Focus on the 2 moving deals and diagnose why the other 10 are stuck.',
          'Great pipeline health — keep doing what you are doing',
          'Open more deals to compensate',
          'Close everything and start fresh',
        ], correct: 0 },
        { question: 'What is the most effective way to unstick a stalled deal?', options: [
          'Ask the coach a direct question: "What would need to happen for us to move forward by [date]?" — create urgency and clarity',
          'Offer a discount',
          'Send more emails',
          'Wait for them to respond',
        ], correct: 0 },
        { question: 'How do you know when to walk away from an opportunity?', options: [
          'When you have followed up 3 times over 2 weeks with no response, or the coach explicitly says no — protect your time for deals that will close',
          'Never walk away',
          'After one missed call',
          'After 6 months of trying',
        ], correct: 0 },
        { question: 'A coach says "Check back with me in the spring." It is September. What do you do?', options: [
          '"Absolutely. I will set a calendar reminder for February 15 — that gives us a full month before spring sports start. In the meantime, I will send you our fall lookbook so you can see what other programs are doing."',
          'Mark them as CLOSED_LOST',
          'Check back in December instead',
          'Forget about them until they call you',
        ], correct: 0 },
      ],
    return bank[quizId] || bank.philosophy;
  }, [quizId]);

  const handleSubmit = async () => {
    if (answers.length < questions.length) return;
    const correct = answers.filter((a, i) => a === questions[i].correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 80;
    setScore(pct);
    setSubmitted(true);

    try {
      await apiFetch('/quizzes', {
        method: 'POST',
        body: JSON.stringify({ userId, quizId, score: pct, passed, answers }),
      });
      onComplete();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white">Quiz: {quizId.replace('_', ' ')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {submitted ? (
          <div className={`p-4 rounded-lg border ${score >= 80 ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5'}`}>
            <p className="font-bold text-lg">{score >= 80 ? '🎉 Passed!' : '📚 Keep Studying'}</p>
            <p className="text-slate-400">Score: {score}% (need 80%)</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-white text-sm">Close</button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <div key={qi}>
                <p className="text-sm font-bold text-white mb-2">{qi + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 p-2 rounded border border-slate-700 hover:bg-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const a = [...answers];
                          a[qi] = oi;
                          setAnswers(a);
                        }}
                      />
                      <span className="text-xs text-slate-300">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleSubmit}
              disabled={answers.length < questions.length || answers.some((a) => a === undefined)}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50"
            >
              Submit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2: CRM Walkthrough
// ═══════════════════════════════════════════════════════════════════

function Phase2Tab({ userId }: { userId: number }) {
  const [steps, setSteps] = useState<WalkthroughStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/phase2-status?userId=${userId}`)
      .then((data: any) => setSteps(data.steps || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const completeStep = async (stepId: string) => {
    try {
      await apiFetch('/walkthrough', {
        method: 'POST',
        body: JSON.stringify({ userId, stepId }),
      });
      const data = await apiFetch(`/phase2-status?userId=${userId}`);
      setSteps(data.steps || []);
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = steps.length > 0 && steps.every((s) => s.completed);

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="bg-blue-400/5 border border-blue-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-blue-300">Phase 2: CRM Orientation</h2>
        <p className="text-sm text-slate-400 mt-1">
          Read-only guided tour of the production CRM. Learn the layout, data model, and workflow
          before you create anything. No data is modified during this phase.
        </p>
        <div className="mt-3">
          <span className="text-sm text-slate-400">Progress: </span>
          <span className="font-bold text-white">{completedCount}/{WALKTHROUGH_STEPS.length} sections completed</span>
          {allComplete && (
            <span className="ml-2 text-xs bg-blue-400/20 text-blue-300 px-2 py-1 rounded font-bold">✓ PHASE COMPLETE</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {WALKTHROUGH_STEPS.map((step) => {
          const status = steps.find((s) => s.stepId === step.stepId);
          const completed = status?.completed ?? false;

          return (
            <div
              key={step.stepId}
              className={`border rounded-lg p-4 flex items-center justify-between ${
                completed ? 'border-blue-400/30 bg-blue-400/5' : 'border-slate-700 bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xl ${completed ? 'text-blue-400' : 'text-slate-600'}`}>
                  {completed ? '✓' : '○'}
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{step.label}</h3>
                  <p className="text-xs text-slate-400">{step.description}</p>
                </div>
              </div>
              <button
                onClick={() => completeStep(step.stepId)}
                disabled={completed}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  completed
                    ? 'bg-blue-400/20 text-blue-300 cursor-default'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {completed ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3: Sandbox Territory (Isolated CRUD)
// ═══════════════════════════════════════════════════════════════════

function Phase3Tab({ userId }: { userId: number }) {
  const [orgs, setOrgs] = useState<SandboxOrg[]>([]);
  const [contacts, setContacts] = useState<Record<number, SandboxContact[]>>({});
  const [opps, setOpps] = useState<SandboxOpportunity[]>([]);
  const [activities, setActivities] = useState<SandboxActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewContact, setShowNewContact] = useState<number | null>(null);
  const [showNewOpp, setShowNewOpp] = useState(false);
  const [showNewActivity, setShowNewActivity] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [orgsData, oppsData, actsData] = await Promise.all([
        apiFetch(`/sandbox/orgs?userId=${userId}`),
        apiFetch(`/sandbox/opportunities?userId=${userId}`),
        apiFetch(`/sandbox/activities?userId=${userId}`),
      ]);
      setOrgs(orgsData || []);
      setOpps(oppsData || []);
      setActivities(actsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadContacts = async (orgId: number) => {
    try {
      const data = await apiFetch(`/sandbox/contacts?userId=${userId}&orgId=${orgId}`);
      setContacts((prev) => ({ ...prev, [orgId]: data || [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const createOrg = async (name: string, website: string, address: string, research: string, sourceUrl: string) => {
    await apiFetch('/sandbox/orgs', {
      method: 'POST',
      body: JSON.stringify({ userId, name, website, physical_address: address, research_notes: research, source_url: sourceUrl }),
    });
    setShowNewOrg(false);
    loadData();
  };

  const createContact = async (orgId: number, fullName: string, title: string, email: string, phone: string, source: string) => {
    await apiFetch('/sandbox/contacts', {
      method: 'POST',
      body: JSON.stringify({ userId, sandboxOrgId: orgId, fullName, title, email, phone, sourceCitation: source }),
    });
    setShowNewContact(null);
    loadContacts(orgId);
  };

  const createOpp = async (orgId: number, lane: string, value: number, closeDate: string, sport: string, notes: string) => {
    await apiFetch('/sandbox/opportunities', {
      method: 'POST',
      body: JSON.stringify({ userId, sandboxOrgId: orgId, lane, estimatedValue: value, targetCloseDate: closeDate, sport, notes }),
    });
    setShowNewOpp(false);
    loadData();
  };

  const createActivity = async (type: string, notes: string, orgId: number | null, template: string) => {
    await apiFetch('/sandbox/activities', {
      method: 'POST',
      body: JSON.stringify({ userId, activityType: type, notes, sandboxOrgId: orgId, templateUsed: template || null }),
    });
    setShowNewActivity(false);
    loadData();
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-amber-300">Phase 3: Territory Development (SANDBOX)</h2>
        <p className="text-sm text-slate-400 mt-1">
          ⚠️ ALL work happens in your ISOLATED sandbox. Production CRM is NOT affected. Data is
          promoted to production only after Director approval at graduation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['Organizations', orgs.length, '5 required'],
          ['Contacts', Object.values(contacts).flat().length, '15 required'],
          ['Opportunities', opps.length, '5 required'],
          ['Activities', activities.length, '15 required'],
        ].map(([label, count, req]) => (
          <div key={label as string} className="border border-slate-700 rounded-lg p-3 bg-slate-800/30 text-center">
            <div className="text-2xl font-black text-white">{count as number}</div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xs text-slate-500">{req}</div>
          </div>
        ))}
      </div>

      {/* Orgs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Organizations</h3>
          <button onClick={() => setShowNewOrg(true)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
            + Add Org
          </button>
        </div>
        {orgs.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-lg text-center">
            No organizations yet. Claim schools from the Lead Taxonomy or create new ones.
          </p>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <div key={org.id} className="border border-slate-700 rounded-lg p-3 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{org.name}</span>
                    {org.website && <span className="text-xs text-slate-400 ml-2">{org.website}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowNewContact(org.id); loadContacts(org.id); }}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      + Contact
                    </button>
                  </div>
                </div>
                {org.research_notes && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{org.research_notes}</p>
                )}
                {/* Show contacts if loaded */}
                {contacts[org.id] && contacts[org.id].length > 0 && (
                  <div className="mt-2 pl-3 border-l border-slate-700">
                    {contacts[org.id].map((c) => (
                      <div key={c.id} className="text-xs text-slate-300 py-0.5">
                        {c.full_name} — {c.title || 'No title'}
                        {c.email && <span className="text-slate-500 ml-1">{c.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opps Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Opportunities</h3>
          <button onClick={() => setShowNewOpp(true)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
            + Add Opportunity
          </button>
        </div>
        {opps.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-lg text-center">
            No opportunities yet. Create your first from the sandbox organizations.
          </p>
        ) : (
          <div className="space-y-2">
            {opps.map((opp) => (
              <div key={opp.id} className="border border-slate-700 rounded-lg p-3 bg-slate-800/30 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white text-sm">{opp.lane}</span>
                  <span className="text-xs text-slate-400 ml-2">{opp.sport || 'No sport'}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${opp.stage === 'CLOSED_WON' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                    {opp.stage}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-300">${opp.estimated_value?.toLocaleString() || '0'}</span>
                  {opp.target_close_date && (
                    <div className="text-xs text-slate-500">{new Date(opp.target_close_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Activities ({activities.length})</h3>
          <button onClick={() => setShowNewActivity(true)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
            + Log Activity
          </button>
        </div>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-lg text-center">
            No activities logged. Log calls, emails, meetings, and visits.
          </p>
        ) : (
          <div className="space-y-1">
            {activities.slice(0, 10).map((act) => (
              <div key={act.id} className="flex items-center gap-2 text-sm py-1 border-b border-slate-800">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  act.activity_type === 'call' ? 'bg-blue-400/20 text-blue-300' :
                  act.activity_type === 'email' ? 'bg-purple-400/20 text-purple-300' :
                  'bg-slate-700 text-slate-300'
                }`}>{act.activity_type}</span>
                <span className="text-slate-300 truncate flex-1">{act.notes || act.description || 'No notes'}</span>
                <span className="text-xs text-slate-500">{new Date(act.scheduled_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Org Modal */}
      {showNewOrg && (
        <SimpleFormModal title="Add Sandbox Organization" onClose={() => setShowNewOrg(false)}>
          {(setField) => {
            const fields: any = {};
            return (
              <form onSubmit={(e) => { e.preventDefault(); createOrg(fields.name, fields.website, fields.address, fields.research, fields.sourceUrl); }}>
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="School Name *" onChange={(e) => fields.name = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Website *" onChange={(e) => fields.website = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Physical Address *" onChange={(e) => fields.address = e.target.value} required />
                <textarea className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Research Notes (200+ chars) *" rows={3} onChange={(e) => fields.research = e.target.value} required />
                <input className="w-full mb-3 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Source URL *" onChange={(e) => fields.sourceUrl = e.target.value} required />
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-sm">Create Organization</button>
              </form>
            );
          }}
        </SimpleFormModal>
      )}

      {/* New Contact Modal */}
      {showNewContact && (
        <SimpleFormModal title="Add Contact" onClose={() => setShowNewContact(null)}>
          {(setField) => {
            const fields: any = {};
            return (
              <form onSubmit={(e) => { e.preventDefault(); createContact(showNewContact!, fields.fullName, fields.title, fields.email, fields.phone, fields.source); }}>
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Full Name *" onChange={(e) => fields.fullName = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Title *" onChange={(e) => fields.title = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Email" onChange={(e) => fields.email = e.target.value} />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Phone" onChange={(e) => fields.phone = e.target.value} />
                <input className="w-full mb-3 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Source Citation" onChange={(e) => fields.source = e.target.value} />
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-sm">Create Contact</button>
              </form>
            );
          }}
        </SimpleFormModal>
      )}

      {/* New Opp Modal */}
      {showNewOpp && (
        <SimpleFormModal title="Add Opportunity" onClose={() => setShowNewOpp(false)}>
          {(setField) => {
            const fields: any = {};
            return (
              <form onSubmit={(e) => { e.preventDefault(); createOpp(Number(fields.orgId), fields.lane, Number(fields.value), fields.closeDate, fields.sport, fields.notes); }}>
                <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.orgId = e.target.value} required>
                  <option value="">Select Organization *</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.lane = e.target.value} required>
                  <option value="">Select Lane *</option>
                  {LANES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" type="number" placeholder="Estimated Value ($) *" onChange={(e) => fields.value = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" type="date" placeholder="Target Close Date" onChange={(e) => fields.closeDate = e.target.value} />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Sport (e.g., Football)" onChange={(e) => fields.sport = e.target.value} />
                <textarea className="w-full mb-3 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Notes *" rows={2} onChange={(e) => fields.notes = e.target.value} required />
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-sm">Create Opportunity</button>
              </form>
            );
          }}
        </SimpleFormModal>
      )}

      {/* New Activity Modal */}
      {showNewActivity && (
        <SimpleFormModal title="Log Activity" onClose={() => setShowNewActivity(false)}>
          {(setField) => {
            const fields: any = {};
            return (
              <form onSubmit={(e) => { e.preventDefault(); createActivity(fields.type, fields.notes, fields.orgId ? Number(fields.orgId) : null, fields.template); }}>
                <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.type = e.target.value} required>
                  <option value="">Activity Type *</option>
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="visit">School Visit</option>
                </select>
                <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.orgId = e.target.value}>
                  <option value="">Link to Organization (optional)</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                {fields.type === 'email' && (
                  <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.template = e.target.value}>
                    <option value="">Template Used (optional)</option>
                    <option value="first_contact">First Contact</option>
                    <option value="lane_expansion">Lane Expansion</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                )}
                <textarea className="w-full mb-3 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Notes *" rows={2} onChange={(e) => fields.notes = e.target.value} required />
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-sm">Log Activity</button>
              </form>
            );
          }}
        </SimpleFormModal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 4: Sales Execution
// ═══════════════════════════════════════════════════════════════════

function Phase4Tab({ userId }: { userId: number }) {
  const [executions, setExecutions] = useState<SalesExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await apiFetch(`/sales-executions?userId=${userId}`);
      setExecutions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const createExecution = async (type: string, notes: string, objection: string, score: number) => {
    await apiFetch('/sales-executions', {
      method: 'POST',
      body: JSON.stringify({ userId, executionType: type, notes, objectionHandled: objection || null, score }),
    });
    setShowNew(false);
    loadData();
  };

  const phoneCalls = executions.filter((e) => e.execution_type === 'phone_call').length;
  const emailPitches = executions.filter((e) => e.execution_type === 'email_pitch').length;
  const objections = executions.filter((e) => e.execution_type === 'objection_handling').length;

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="bg-purple-400/5 border border-purple-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-purple-300">Phase 4: Sales Execution</h2>
        <p className="text-sm text-slate-400 mt-1">
          Practice real selling: phone calls, pitch emails, and objection handling. Role-play with
          your mentor before going live. This is where data entry becomes SELLING.
        </p>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Phone Calls', phoneCalls, 'phone_call', '📞', 'min 1'],
          ['Email Pitches', emailPitches, 'email_pitch', '✉️', 'min 1'],
          ['Objection Handling', objections, 'objection_handling', '🛡️', 'min 1'],
        ].map(([label, count, type, icon, req]) => (
          <div key={label as string} className={`border rounded-lg p-3 text-center ${(count as number) >= 1 ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-700 bg-slate-800/30'}`}>
            <div className="text-xl">{icon}</div>
            <div className="text-2xl font-black text-white">{count as number}</div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xs text-slate-500">{req}</div>
          </div>
        ))}
      </div>

      {/* Executions List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Execution Log</h3>
          <button onClick={() => setShowNew(true)} className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-bold">
            + Record Execution
          </button>
        </div>
        {executions.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-lg text-center">
            No sales executions recorded. Make calls, send pitches, and handle objections.
          </p>
        ) : (
          <div className="space-y-2">
            {executions.map((exec) => (
              <div key={exec.id} className="border border-slate-700 rounded-lg p-3 bg-slate-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    exec.execution_type === 'phone_call' ? 'bg-blue-400/20 text-blue-300' :
                    exec.execution_type === 'email_pitch' ? 'bg-emerald-400/20 text-emerald-300' :
                    'bg-amber-400/20 text-amber-300'
                  }`}>
                    {exec.execution_type.replace('_', ' ')}
                  </span>
                  {exec.score && (
                    <span className="text-xs text-slate-400">Score: {exec.score}/100</span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{exec.notes}</p>
                {exec.objection_handled && (
                  <p className="text-xs text-amber-300 mt-1">Objection: {exec.objection_handled}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Execution Modal */}
      {showNew && (
        <SimpleFormModal title="Record Sales Execution" onClose={() => setShowNew(false)}>
          {(setField) => {
            const fields: any = {};
            return (
              <form onSubmit={(e) => { e.preventDefault(); createExecution(fields.type, fields.notes, fields.objection, Number(fields.score || 0)); }}>
                <select className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" onChange={(e) => fields.type = e.target.value} required>
                  <option value="">Execution Type *</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="email_pitch">Email Pitch</option>
                  <option value="objection_handling">Objection Handling</option>
                  <option value="role_play">Role Play</option>
                  <option value="shadow_session">Shadow Session</option>
                </select>
                <textarea className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Notes: What happened? What did you learn? *" rows={3} onChange={(e) => fields.notes = e.target.value} required />
                <input className="w-full mb-2 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" placeholder="Objection Handled (if applicable)" onChange={(e) => fields.objection = e.target.value} />
                <input className="w-full mb-3 p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm" type="number" placeholder="Self Score (0-100)" onChange={(e) => fields.score = e.target.value} />
                <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded font-bold text-sm">Record Execution</button>
              </form>
            );
          }}
        </SimpleFormModal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD TAXONOMY
// ═══════════════════════════════════════════════════════════════════

function LeadsTab({ userId }: { userId: number }) {
  const [leads, setLeads] = useState<LeadTaxonomy[]>([]);
  const [dedupResult, setDedupResult] = useState<{ clusters: number; duplicates: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('unclaimed');

  const loadLeads = useCallback(async () => {
    try {
      const data = await apiFetch(`/leads?status=${statusFilter}&limit=50`);
      setLeads(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const claimLead = async (leadId: number) => {
    try {
      await apiFetch('/leads/claim', {
        method: 'POST',
        body: JSON.stringify({ userId, leadId }),
      });
      loadLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const runDedup = async () => {
    try {
      const result = await apiFetch('/leads/dedup-scan', { method: 'POST', body: JSON.stringify({ userId }) });
      setDedupResult(result);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-cyan-300">Lead Taxonomy</h2>
        <p className="text-sm text-slate-400 mt-1">
          296 existing leads from the production CRM. Claim schools for your sandbox territory.
          Run dedup scan to find and merge duplicates.
        </p>
      </div>

      {/* Dedup */}
      <div className="mb-4 flex gap-3 items-center">
        <button
          onClick={runDedup}
          className="px-4 py-2 bg-cyan-600 text-white rounded text-sm font-bold"
        >
          Run Dedup Scan
        </button>
        {dedupResult && (
          <span className="text-sm text-slate-300">
            Found <span className="font-bold text-amber-300">{dedupResult.duplicates} duplicates</span> in {dedupResult.clusters} clusters
          </span>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4">
        {(['unclaimed', 'claimed', 'active', 'closed', 'stale'] as string[]).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setLoading(true); }}
            className={`px-3 py-1 rounded text-xs font-bold capitalize ${
              statusFilter === s
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Lead Table */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left p-3 text-slate-400 font-bold">Lead Name</th>
              <th className="text-left p-3 text-slate-400 font-bold">Status</th>
              <th className="text-left p-3 text-slate-400 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={3} className="p-4 text-center text-slate-500">No leads found</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                  <td className="p-3 text-white">{lead.lead_name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold capitalize ${
                      lead.lead_status === 'unclaimed' ? 'bg-slate-700 text-slate-300' :
                      lead.lead_status === 'claimed' ? 'bg-blue-400/20 text-blue-300' :
                      'bg-emerald-400/20 text-emerald-300'
                    }`}>{lead.lead_status}</span>
                  </td>
                  <td className="p-3">
                    {lead.lead_status === 'unclaimed' && (
                      <button
                        onClick={() => claimLead(lead.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-500"
                      >
                        Claim
                      </button>
                    )}
                    {lead.claimed_by === userId && (
                      <span className="text-xs text-emerald-300">Your Lead</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GRADUATION
// ═══════════════════════════════════════════════════════════════════

function GraduationTab({ userId }: { userId: number }) {
  const [status, setStatus] = useState<GraduationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch(`/graduation-status?userId=${userId}`);
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const approveGraduation = async () => {
    setApproving(true);
    try {
      await apiFetch('/graduation/director-approve', {
        method: 'POST',
        body: JSON.stringify({ userId, directorId: userId }),
      });
      loadStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!status) return <div className="text-slate-400">No graduation data yet.</div>;

  return (
    <div>
      <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-emerald-300">Graduation Status</h2>
        <p className="text-sm text-slate-400 mt-1">
          Quality-gated certification. All phases must be complete and quality gates passed.
          Director approval is sample-based, not 100% review.
        </p>
      </div>

      {/* Phase Progress */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          ['Phase 1', status.phase1.completed, 'Foundations'],
          ['Phase 2', status.phase2.completed, 'CRM Walkthrough'],
          ['Phase 3', status.phase3.completed, 'Sandbox Territory'],
          ['Phase 4', status.phase4.completed, 'Sales Execution'],
          ['Phase 5', status.phase5.completed, 'Graduation'],
        ].map(([label, completed, desc]) => (
          <div key={label as string} className={`border rounded-lg p-3 text-center ${completed ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-700 bg-slate-800/30'}`}>
            <div className={`text-xl ${completed ? 'text-emerald-400' : 'text-slate-600'}`}>
              {completed ? '✓' : '○'}
            </div>
            <div className="text-sm font-bold text-white">{label}</div>
            <div className="text-xs text-slate-500">{desc}</div>
          </div>
        ))}
      </div>

      {/* Quality Gates */}
      <h3 className="font-bold text-white mb-3">Quality Gates</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Count-based gates */}
        {([
          ['Organizations', status.gates.orgs.current, status.gates.orgs.required, status.gates.orgs.met],
          ['Contacts', status.gates.contacts.current, status.gates.contacts.required, status.gates.contacts.met],
          ['Opportunities', status.gates.opps.current, status.gates.opps.required, status.gates.opps.met],
          ['Activities', status.gates.activities.current, status.gates.activities.required, status.gates.activities.met],
          ['Sales Executions', status.gates.sales_executions.current, status.gates.sales_executions.required, status.gates.sales_executions.met],
        ] as [string, number, number, boolean][]).map(([label, current, required, met]) => (
          <div key={label} className={`border rounded-lg p-3 flex justify-between items-center ${met ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-700 bg-slate-800/30'}`}>
            <span className="text-sm text-white">{label}</span>
            <div className="text-right">
              <span className="text-sm font-bold">
                <span className={met ? 'text-emerald-300' : 'text-amber-300'}>{current}</span>
                <span className="text-slate-500">/{required}</span>
              </span>
              <span className={`ml-2 text-xs ${met ? 'text-emerald-400' : 'text-slate-600'}`}>{met ? '✓' : '✗'}</span>
            </div>
          </div>
        ))}
        {/* Director Approval gate */}
        <div className={`border rounded-lg p-3 flex justify-between items-center ${status.gates.directorApproved.met ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-700 bg-slate-800/30'}`}>
          <span className="text-sm text-white">Director Approved</span>
          <span className={`text-xs ${status.gates.directorApproved.met ? 'text-emerald-400' : 'text-slate-600'}`}>
            {status.gates.directorApproved.met ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Actions */}
      {status.ready_to_graduate ? (
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-lg p-4 text-center">
          <p className="text-emerald-300 font-bold mb-2">🎓 Ready to Graduate!</p>
          <p className="text-sm text-slate-400 mb-3">All phases complete, all quality gates passed, Director approved.</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          {status.all_passed && !status.gates.directorApproved.met && (
            <div className="text-center">
              <p className="text-amber-300 font-bold mb-2">Quality Gates Passed — Awaiting Director Approval</p>
              <button
                onClick={approveGraduation}
                disabled={approving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Approve Graduation (Director)'}
              </button>
            </div>
          )}
          {!status.all_passed && (
            <p className="text-slate-400 text-sm text-center">
              Complete all phases and quality gates to unlock graduation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REUSABLE MODAL
// ═══════════════════════════════════════════════════════════════════

function SimpleFormModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: (setField: (field: string, value: string) => void) => React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        {children(() => {})}
      </div>
    </div>
  );
}
// v3 deploy trigger Thu Jul 30 15:47:43 CDT 2026
