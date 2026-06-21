exports.up = (pgm) => {
  // Production-safe, idempotent Academy content seed. No progress/completion data is created.
  pgm.sql(`
    WITH incoming(title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type) AS (
      VALUES
      ('Welcome to TUF Sports Apparel', 'TUF exists to help schools, clubs, and teams buy apparel with speed, trust, and clear follow-through. Reps sell outcomes: sharper unifo', 'REP', 'LEVEL_1_OPERATOR', 1, '## Training Explanation
TUF exists to help schools, clubs, and teams buy apparel with speed, trust, and clear follow-through. Reps sell outcomes: sharper uniforms, easier parent ordering, reliable delivery, and repeatable annual programs.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Call one assigned school and practice a 30-second TUF introduction. Done means you can explain who TUF serves, what problems we solve, and what next step you are asking for.

## Practical Checkpoint
Introduce yourself as a territory partner, not a catalog rep. Learn the TUF lanes, buyer types, and why every conversation must end with a logged next step.
', 35, 'MODULE'),
      ('How TUF Makes Money', 'TUF earns through uniforms, player packs, team stores, travel gear, letterman campaigns, and repeat school relationships. Margin comes ', 'REP', 'LEVEL_1_OPERATOR', 2, '## Training Explanation
TUF earns through uniforms, player packs, team stores, travel gear, letterman campaigns, and repeat school relationships. Margin comes from disciplined pricing, clean order handoff, and expanding accounts beyond one sport.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Write a one-paragraph account expansion plan for one school. Done means it includes at least three revenue lanes and a realistic season trigger.

## Practical Checkpoint
Protect margin. Do not apologize for price. Tie every quote to value, speed, service, quality, and reduced administrative work for coaches and ADs.
', 35, 'MODULE'),
      ('Rep Expectations: 4 Orders Per Month', 'The launch standard is four completed orders per month. That requires daily touches, clean follow-up, accurate CRM notes, and enough pi', 'REP', 'LEVEL_1_OPERATOR', 3, '## Training Explanation
The launch standard is four completed orders per month. That requires daily touches, clean follow-up, accurate CRM notes, and enough pipeline coverage to survive delays.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a weekly activity plan that can support four orders. Done means it names target schools, sports, contacts, and next actions.

## Practical Checkpoint
Work the assigned book every day: touch schools, open opportunities, follow up on invoices, and ask for referrals into feeder and youth programs.
', 35, 'MODULE'),
      ('72-Hour Certification Standard', 'Reps have a 72-hour window to complete Academy modules, prove practical selling ability, and earn director sign-off before full CRM acc', 'REP', 'LEVEL_1_OPERATOR', 4, '## Training Explanation
Reps have a 72-hour window to complete Academy modules, prove practical selling ability, and earn director sign-off before full CRM access.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Complete the Level 1 modules and schedule practical review. Done means you can state what unlocks CRM: modules, HR docs, practical exercise, and director sign-off.

## Practical Checkpoint
Move fast. Finish modules, practice the scripts, complete the Locker Room Simulator exercise, and ask your director for review.
', 35, 'MODULE'),
      ('How Certification Unlocks CRM Access', 'Academy is open first. Full CRM access remains gated until required modules, HR documents, practical exercise, and director sign-off ar', 'REP', 'LEVEL_1_OPERATOR', 5, '## Training Explanation
Academy is open first. Full CRM access remains gated until required modules, HR documents, practical exercise, and director sign-off are complete.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Review the certification checklist. Done means you can explain why uncertified reps see Academy/dashboard only and what must happen before unlock.

## Practical Checkpoint
Do not attempt live selling from memory. Use Academy, simulator practice, and director coaching before pushing live pipeline.
', 35, 'MODULE'),
      ('Uniforms: TUF SHIFT, TUF GRIND, TUF OVERTIME, TUF FLEX', 'Uniform selling starts with sport, roster size, season date, current vendor pain, design expectations, and reorder needs. SHIFT, GRIND,', 'REP', 'LEVEL_2_PRODUCT', 1, '## Training Explanation
Uniform selling starts with sport, roster size, season date, current vendor pain, design expectations, and reorder needs. SHIFT, GRIND, OVERTIME, and FLEX give reps language for performance, durability, speed, and program identity.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Practice a football or basketball uniform pitch. Done means you can ask for roster size, season date, artwork needs, and mockup approval.

## Practical Checkpoint
Ask: what are you wearing now, what has to improve, when do you need it, and who approves the look? Sell a mockup or sample as the next step.
', 35, 'MODULE'),
      ('Player Packs and Travel Gear', 'Player packs and travel gear turn a uniform sale into a complete team package. Coaches want simplicity, consistent appearance, and fewe', 'REP', 'LEVEL_2_PRODUCT', 2, '## Training Explanation
Player packs and travel gear turn a uniform sale into a complete team package. Coaches want simplicity, consistent appearance, and fewer parent questions.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Create a player-pack upsell script. Done means it includes three pack items, buyer value, and a close for quantities.

## Practical Checkpoint
Position packs as player readiness, team identity, and parent convenience. Attach them to every uniform conversation.
', 35, 'MODULE'),
      ('Team Stores', 'Team stores create fan revenue, parent convenience, and repeatable seasonal ordering. They work for schools, boosters, youth clubs, and', 'REP', 'LEVEL_2_PRODUCT', 3, '## Training Explanation
Team stores create fan revenue, parent convenience, and repeatable seasonal ordering. They work for schools, boosters, youth clubs, and travel programs.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Draft a team-store pitch. Done means it includes launch timing, audience, product mix, and who promotes the link.

## Practical Checkpoint
Ask who buys fan gear today, how orders are collected, and whether the coach or booster club wants fundraising.
', 35, 'MODULE'),
      ('Letterman Jackets', 'Letterman jackets are annual recognition campaigns. The buyer may be AD, activities office, booster, or parents. Timing and school trad', 'REP', 'LEVEL_2_PRODUCT', 4, '## Training Explanation
Letterman jackets are annual recognition campaigns. The buyer may be AD, activities office, booster, or parents. Timing and school tradition matter.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a letterman campaign checklist. Done means it includes decision maker, order window, sizing day, and follow-up date.

## Practical Checkpoint
Ask when awards are announced, how jackets are ordered today, and who manages patches/letters.
', 35, 'MODULE'),
      ('Price Confidence and Margin Basics', 'Price confidence protects the business. Reps must know that discounting without reason trains buyers to ignore value. Margin funds serv', 'REP', 'LEVEL_2_PRODUCT', 5, '## Training Explanation
Price confidence protects the business. Reps must know that discounting without reason trains buyers to ignore value. Margin funds service, production, and growth.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Write a response to “your price is high.” Done means it defends value without attacking the competitor.

## Practical Checkpoint
When challenged on price, compare total value: design support, reliability, consolidated ordering, service, and repeat program planning.
', 35, 'MODULE'),
      ('Understanding Assigned Schools', 'Assigned schools are your book. Assignment alone is not a touch. A school is touched only when there is a logged call, email, text, mee', 'REP', 'LEVEL_3_TERRITORY', 1, '## Training Explanation
Assigned schools are your book. Assignment alone is not a touch. A school is touched only when there is a logged call, email, text, meeting, note, opportunity activity, or contact.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Pick ten assigned schools and identify first touch, likely sport, and decision maker. Done means every school has a logged plan.

## Practical Checkpoint
Prioritize Tier 1 and seasonal buying windows. Every school needs a contact, sport trigger, and next action.
', 35, 'MODULE'),
      ('How to Work Athletic Directors and Coaches', 'ADs control standards and relationships; coaches control pain, urgency, and team needs. Work both respectfully.', 'REP', 'LEVEL_3_TERRITORY', 2, '## Training Explanation
ADs control standards and relationships; coaches control pain, urgency, and team needs. Work both respectfully.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Practice an AD intro call. Done means you ask permission, name the value, and request one coach introduction.

## Practical Checkpoint
Lead with program support, not product dumping. Ask ADs for the right coach introductions and ask coaches for roster/timeline detail.
', 35, 'MODULE'),
      ('Feeder Programs and Youth Extraction', 'Feeder programs create volume and future school relationships. Youth and club directors often need stores, packs, and simplified orderi', 'REP', 'LEVEL_3_TERRITORY', 3, '## Training Explanation
Feeder programs create volume and future school relationships. Youth and club directors often need stores, packs, and simplified ordering.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Add one feeder referral ask to your script. Done means you can ask without sounding desperate or transactional.

## Practical Checkpoint
After each school conversation ask: which youth programs feed this team and who runs them?
', 35, 'MODULE'),
      ('Travel Teams and Club Opportunities', 'Travel and club teams buy more frequently, move faster, and need identity. They can become team store and pack accounts quickly.', 'REP', 'LEVEL_3_TERRITORY', 4, '## Training Explanation
Travel and club teams buy more frequently, move faster, and need identity. They can become team store and pack accounts quickly.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
List three travel/club targets. Done means each has sport, season, buyer guess, and first touch.

## Practical Checkpoint
Look for off-season programs, tournament teams, and parent-led organizations near assigned schools.
', 35, 'MODULE'),
      ('How to Log a School Touch Correctly', 'If it is not logged, it did not happen. Touches must be auditable and tied to the account or opportunity.', 'REP', 'LEVEL_3_TERRITORY', 5, '## Training Explanation
If it is not logged, it did not happen. Touches must be auditable and tied to the account or opportunity.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Log one sample touch in training/demo. Done means the note includes who, what happened, next step, and date.

## Practical Checkpoint
Log calls, emails, texts, meetings, notes, opportunity activity, and contacts. Do not count assignment as activity.
', 35, 'MODULE'),
      ('Discovery Call Framework', 'Discovery finds pain, timing, authority, budget range, sport needs, and next step. It is not a product monologue.', 'REP', 'LEVEL_4_SALES', 1, '## Training Explanation
Discovery finds pain, timing, authority, budget range, sport needs, and next step. It is not a product monologue.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Run a five-question discovery script. Done means you can summarize current state, desired state, gap, and next step.

## Practical Checkpoint
Use questions: what are you using now, what is not working, when is the season, who signs off, and what would make switching worth it?
', 35, 'MODULE'),
      ('First Contact Script', 'First contact must be short, relevant, and specific. The goal is not to close; it is to earn the next conversation.', 'REP', 'LEVEL_4_SALES', 2, '## Training Explanation
First contact must be short, relevant, and specific. The goal is not to close; it is to earn the next conversation.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Record or rehearse the opening. Done means it is under 30 seconds and asks one clear question.

## Practical Checkpoint
Opening: “Coach, I work with TUF Sports Apparel. We help programs simplify uniforms, player packs, and team stores. I saw your season window coming up and wanted to ask what you are changing this year.”
', 35, 'MODULE'),
      ('Handling “We Already Have a Vendor”', 'A current vendor is normal. Do not attack them. Find the gap: speed, design, communication, price clarity, store execution, or expansio', 'REP', 'LEVEL_4_SALES', 3, '## Training Explanation
A current vendor is normal. Do not attack them. Find the gap: speed, design, communication, price clarity, store execution, or expansion.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Practice three vendor-objection responses. Done means each response asks a diagnostic question.

## Practical Checkpoint
Say: “Totally fair. Most programs do. Where does your current setup work well, and where does it create friction during the season?”
', 35, 'MODULE'),
      ('Getting to Mockup/Sample', 'Mockups and samples turn interest into visible progress. They must be tied to a real team, real season, and decision path.', 'REP', 'LEVEL_4_SALES', 4, '## Training Explanation
Mockups and samples turn interest into visible progress. They must be tied to a real team, real season, and decision path.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Create a mockup close. Done means you can ask for the assets and schedule the review date.

## Practical Checkpoint
Ask for colors, logo/artwork, roster count, sport, deadline, and who reviews the mockup.
', 35, 'MODULE'),
      ('Follow-Up Discipline', 'Follow-up is where most reps lose deals. Every opportunity needs a next action, date, and reason.', 'REP', 'LEVEL_4_SALES', 5, '## Training Explanation
Follow-up is where most reps lose deals. Every opportunity needs a next action, date, and reason.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Write three follow-up messages. Done means each has context, value, and a specific ask.

## Practical Checkpoint
Do not send “just checking in.” Bring value: mockup status, deadline reminder, store launch plan, or roster question.
', 35, 'MODULE'),
      ('Moving from Interest to Closed Won', 'Closed Won requires decision, scope, price, timeline, and handoff clarity. Do not mark a deal won because someone sounded interested.', 'REP', 'LEVEL_4_SALES', 6, '## Training Explanation
Closed Won requires decision, scope, price, timeline, and handoff clarity. Do not mark a deal won because someone sounded interested.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Closed Won checklist. Done means you can explain what happens to orders after Closed Won.

## Practical Checkpoint
Confirm package, quantities, approval, payment/order path, production needs, and delivery expectation.
', 35, 'MODULE'),
      ('Dashboard Basics', 'Dashboard metrics show what needs action: assigned schools, touched/untouched accounts, active opportunities, follow-ups, paid orders, ', 'REP', 'LEVEL_5_EXPANSION', 1, '## Training Explanation
Dashboard metrics show what needs action: assigned schools, touched/untouched accounts, active opportunities, follow-ups, paid orders, and pacing.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Review your dashboard. Done means you can name the top three accounts needing action.

## Practical Checkpoint
Use the dashboard every morning to choose action, not to admire numbers.
', 35, 'MODULE'),
      ('Organizations and Contacts', 'Organizations hold schools, clubs, and account data. Contacts hold the people who move decisions.', 'REP', 'LEVEL_5_EXPANSION', 2, '## Training Explanation
Organizations hold schools, clubs, and account data. Contacts hold the people who move decisions.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Update one organization/contact record. Done means another rep or director could understand the account from your notes.

## Practical Checkpoint
Keep names, roles, emails, phone numbers, sports, and notes clean.
', 35, 'MODULE'),
      ('Opportunities and Stages', 'Opportunities track real commercial movement. Stage changes must reflect buyer progress, not rep optimism.', 'REP', 'LEVEL_5_EXPANSION', 3, '## Training Explanation
Opportunities track real commercial movement. Stage changes must reflect buyer progress, not rep optimism.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Create or review one opportunity. Done means stage, value, next action, and buyer are clear.

## Practical Checkpoint
Create opportunities only when there is a specific sport/product need and next step.
', 35, 'MODULE'),
      ('Orders After Closed Won', 'Closed Won should create an order handoff with assigned rep/director visibility. Orders are where production and payment reality begin.', 'REP', 'LEVEL_5_EXPANSION', 4, '## Training Explanation
Closed Won should create an order handoff with assigned rep/director visibility. Orders are where production and payment reality begin.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Explain the handoff from opportunity to order. Done means you can state why unpaid/draft orders do not create payable commission.

## Practical Checkpoint
Confirm order details, missing information, payment status, and production blockers.
', 35, 'MODULE'),
      ('Commission Basics and Payment-Gated Earnings', 'Commissions are server-side and payment/fulfillment gated. Reps should care about clean order completion, not just verbal wins.', 'REP', 'LEVEL_5_EXPANSION', 5, '## Training Explanation
Commissions are server-side and payment/fulfillment gated. Reps should care about clean order completion, not just verbal wins.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Review the earnings page. Done means you can explain paid order count, estimated commission, and why director override is not rep-visible.

## Practical Checkpoint
Track delivered/completed orders and understand that unpaid/draft work is not payable commission.
', 35, 'MODULE'),
      ('Football', 'Football selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', 'REP', 'SPECIALIZED_TRACKS', 1, '## Training Explanation
Football selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Football mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Basketball', 'Basketball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the spor', 'REP', 'SPECIALIZED_TRACKS', 2, '## Training Explanation
Basketball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Basketball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Baseball', 'Baseball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', 'REP', 'SPECIALIZED_TRACKS', 3, '## Training Explanation
Baseball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Baseball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Volleyball', 'Volleyball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the spor', 'REP', 'SPECIALIZED_TRACKS', 4, '## Training Explanation
Volleyball selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Volleyball mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Women’s Sports', 'Women’s Sports selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the ', 'REP', 'SPECIALIZED_TRACKS', 5, '## Training Explanation
Women’s Sports selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Women’s Sports mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('7v7/Flag', '7v7/Flag selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport ', 'REP', 'SPECIALIZED_TRACKS', 6, '## Training Explanation
7v7/Flag selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a 7v7/Flag mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Youth Programs', 'Youth Programs selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the ', 'REP', 'SPECIALIZED_TRACKS', 7, '## Training Explanation
Youth Programs selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Youth Programs mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Letterman Jacket Campaigns', 'Letterman Jacket Campaigns selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF p', 'REP', 'SPECIALIZED_TRACKS', 8, '## Training Explanation
Letterman Jacket Campaigns selling requires specific buyer timing, language, objections, and expansion paths. Reps must adapt the TUF pitch to the sport or market instead of using one generic script.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a Letterman Jacket Campaigns mini-play. Done means it includes buyer, season window, first question, offer, and follow-up.

## Practical Checkpoint
Study the sport calendar, roster count, parent involvement, and likely add-on lanes. Ask for the next season trigger and a mockup/sample step.
', 25, 'HANDS_ON'),
      ('Director Certification Review', 'Directors certify reps by verifying modules, HR docs, practical simulator exercise, and readiness for live CRM access.', 'REP', 'LEVEL_7_DIRECTOR', 1, '## Training Explanation
Directors certify reps by verifying modules, HR docs, practical simulator exercise, and readiness for live CRM access.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Review one rep checklist. Done means director can justify sign-off or identify the exact blocker.

## Practical Checkpoint
Primeau/directors should coach calls, inspect CRM discipline, and only sign off when a rep can sell responsibly.
', 35, 'MODULE'),
      ('Minnesota Launch Market Mastery', 'Minnesota launch reps must understand school seasonality, football/basketball/baseball opportunities, hockey pockets, youth feeders, an', 'REP', 'MARKET_MASTERY', 1, '## Training Explanation
Minnesota launch reps must understand school seasonality, football/basketball/baseball opportunities, hockey pockets, youth feeders, and booster influence.

## Rep Actions
- Open TUF Ops before outreach and confirm the school, sport, contact, and next action.
- Ask one direct diagnostic question before pitching product.
- Log every real call, email, text, meeting, note, opportunity activity, or contact.
- Create a dated follow-up before ending the work block.

## Field Language
"I am not calling to dump a catalog on you. I am trying to understand what your program needs this season and whether TUF can make uniforms, packs, stores, or recognition gear easier to execute."

## What Done Means
Build a 30-day Minnesota territory attack plan. Done means it names schools, sports, feeder targets, and weekly action volume.

## Practical Checkpoint
Prioritize assigned schools by season and likelihood. Combine school, feeder, and travel opportunities into one territory plan.
', 35, 'MODULE')
    ), updated AS (
      UPDATE training_modules tm
      SET description = i.description,
          phase = i.phase,
          order_index = i.order_index,
          content_markdown = i.content_markdown,
          estimated_duration_minutes = i.estimated_duration_minutes,
          module_type = i.module_type,
          updated_at = NOW()
      FROM incoming i
      WHERE tm.title = i.title AND tm.role = i.role
      RETURNING tm.title, tm.role
    )
    INSERT INTO training_modules (title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type, created_at, updated_at)
    SELECT i.title, i.description, i.role, i.phase, i.order_index, i.content_markdown, i.estimated_duration_minutes, i.module_type, NOW(), NOW()
    FROM incoming i
    WHERE NOT EXISTS (
      SELECT 1 FROM training_modules tm WHERE tm.title = i.title AND tm.role = i.role
    );
  `);
};

exports.down = () => {
  // Intentionally no-op: do not delete Academy content or disrupt learner progress.
};
