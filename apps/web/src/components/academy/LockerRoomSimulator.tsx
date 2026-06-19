import { useState } from 'react';

export type LockerRoomScenario = {
  title: string;
  role: string;
  context: string;
  objective: string;
  customerPersonality: string;
  suggestedOpening: string;
  successCriteria: string[];
  coachingPrompt: string;
};

export const LOCKER_ROOM_SCENARIOS: LockerRoomScenario[] = [
  { title: 'Athletic Director intro call', role: 'Rep vs. AD', context: 'First call into an assigned school.', objective: 'Earn permission to discuss one priority sport and ask for the correct coach introduction.', customerPersonality: 'Busy, direct, protective of coaches.', suggestedOpening: 'Coach/AD, I know you are busy. I work with TUF Sports Apparel helping programs simplify uniforms, player packs, stores, and recognition gear. Which sport is most likely to need attention this season?', successCriteria: ['Respect time', 'Ask one diagnostic question', 'Request a coach intro', 'Log the touch'], coachingPrompt: 'Did the rep sound useful in under 30 seconds and ask for a clear next step?' },
  { title: 'Football coach uniform pitch', role: 'Rep vs. football coach', context: 'Coach is unhappy with current uniform timeline.', objective: 'Qualify roster count, season date, design needs, and close for mockup/sample.', customerPersonality: 'Practical, deadline-driven.', suggestedOpening: 'Coach, before I talk product, what has to be better with this year’s uniforms: look, delivery, fit, or reorders?', successCriteria: ['Roster count captured', 'Deadline captured', 'Mockup assets requested', 'Review date set'], coachingPrompt: 'Did the rep connect TUF SHIFT/GRIND language to the coach’s actual pain?' },
  { title: '“We already have a vendor”', role: 'Rep vs. loyal buyer', context: 'Buyer says they are set with another supplier.', objective: 'Avoid attacking the vendor and uncover one service or timing gap.', customerPersonality: 'Skeptical but fair.', suggestedOpening: 'Totally fair. Most programs already have somebody. Where does the current setup work well, and where does it create friction during the season?', successCriteria: ['No vendor attack', 'Gap question asked', 'Future trigger identified', 'Follow-up logged'], coachingPrompt: 'Did the rep turn resistance into discovery?' },
  { title: 'Budget objection', role: 'Rep vs. budget-conscious coach', context: 'Coach likes the idea but says money is tight.', objective: 'Protect margin while exploring package, timing, store, or booster options.', customerPersonality: 'Interested but cautious.', suggestedOpening: 'I understand. Is the issue total budget, payment timing, or needing a package that parents/boosters can help support?', successCriteria: ['No panic discount', 'Budget type diagnosed', 'Alternative path offered', 'Next step preserved'], coachingPrompt: 'Did the rep defend value and keep momentum?' },
  { title: 'Team store pitch', role: 'Rep vs. coach/booster', context: 'Program needs fan gear and fundraising support.', objective: 'Position a store launch with audience, product mix, and promotion plan.', customerPersonality: 'Interested in easy execution.', suggestedOpening: 'If we made ordering easier for parents and fans, who would promote the store and when would you want it live?', successCriteria: ['Audience identified', 'Launch window set', 'Product mix discussed', 'Promotion owner named'], coachingPrompt: 'Did the rep make the store operational, not theoretical?' },
  { title: 'Player pack upsell', role: 'Rep vs. coach', context: 'Uniform conversation can become full team package.', objective: 'Attach pack items to readiness, identity, and parent convenience.', customerPersonality: 'Wants simple team standards.', suggestedOpening: 'If we solve uniforms, do you also want every player showing up with the same travel and practice gear?', successCriteria: ['Pack items named', 'Quantity path identified', 'Parent/admin value stated', 'Close for package review'], coachingPrompt: 'Did the rep attach packs naturally to the uniform need?' },
  { title: 'Letterman jacket campaign', role: 'Rep vs. AD/activities office', context: 'School has annual recognition needs.', objective: 'Find order window, sizing day, patch process, and approval owner.', customerPersonality: 'Tradition-focused and detail-oriented.', suggestedOpening: 'How are letterman jackets handled now, and when do families usually start asking about them?', successCriteria: ['Tradition respected', 'Timeline captured', 'Sizing/order process mapped', 'Campaign follow-up set'], coachingPrompt: 'Did the rep treat jackets as a campaign instead of a one-off item?' },
  { title: 'Feeder/youth referral ask', role: 'Rep vs. coach', context: 'School conversation can open youth/travel ecosystem.', objective: 'Ask for the feeder or youth contact without sounding transactional.', customerPersonality: 'Helpful if trust is earned.', suggestedOpening: 'A lot of programs want the youth teams looking connected to the high school. Who runs the main feeder group for your program?', successCriteria: ['Referral ask made', 'Value to youth program stated', 'Contact captured', 'Next touch planned'], coachingPrompt: 'Did the rep earn the referral by connecting it to program identity?' },
  { title: 'Follow-up after no response', role: 'Rep vs. silent prospect', context: 'Prospect has not replied after initial interest.', objective: 'Restart with value and a specific question.', customerPersonality: 'Distracted, not hostile.', suggestedOpening: 'Coach, I do not want to clutter your inbox. Should I keep the uniform/player-pack idea alive for this season, or circle back after your current deadline passes?', successCriteria: ['No “just checking in”', 'Context included', 'Clear choice offered', 'Next date logged'], coachingPrompt: 'Did the rep make it easy for the buyer to answer?' },
  { title: 'Closing for mockup/sample', role: 'Rep vs. interested buyer', context: 'Buyer is interested but has not committed.', objective: 'Secure assets, quantities, and a review date for mockup/sample.', customerPersonality: 'Positive but busy.', suggestedOpening: 'The next useful step is not another general conversation. Let’s build a mockup around your colors, logo, and roster count so you can react to something real.', successCriteria: ['Assets requested', 'Roster/quantity captured', 'Review date set', 'Opportunity updated'], coachingPrompt: 'Did the rep convert interest into a concrete next step?' },
];

export default function LockerRoomSimulator() {
  const [active, setActive] = useState(LOCKER_ROOM_SCENARIOS[0]);
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-5 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Academy Practice</p>
          <h2 className="text-2xl font-black text-white">Locker Room Simulator</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Always-available sales practice for TUF reps. Complete at least one required scenario, review it with your director, then your director/admin can mark practical exercise complete.</p>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100">v0.9: manual director review</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {LOCKER_ROOM_SCENARIOS.map((scenario) => (
            <button key={scenario.title} onClick={() => setActive(scenario)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${active.title === scenario.title ? 'border-cyan-300 bg-cyan-500/15 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50'}`}>{scenario.title}</button>
          ))}
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#070c13]/80 p-4">
          <h3 className="text-xl font-black text-white">{active.title}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{active.role}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Info label="Context" value={active.context} />
            <Info label="Rep Objective" value={active.objective} />
            <Info label="Customer Personality" value={active.customerPersonality} />
            <Info label="Suggested Opening" value={`“${active.suggestedOpening}”`} />
          </div>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Success Criteria</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">{active.successCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"><strong>Coaching feedback prompt:</strong> {active.coachingPrompt}</div>
          <button onClick={() => setActive({ ...active })} className="mt-4 rounded-md border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400">Retry Scenario</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm leading-6 text-slate-300">{value}</p></div>;
}
