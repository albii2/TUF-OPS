// ─── Academy Resources — Sales Playbook, TAE Packet, Briefings, Product docs ───
// Created: 2026-08-18 — production-readiness for Minnesota cohort
// Gives reps a permanent in-app Resources area (Mission 7) instead of digging through emails.
// Content sourced from existing repo docs (docs/academy/*) + founder directive (Fall 2026 briefing).

exports.up = async (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_resources (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'document',
      body_markdown TEXT,
      external_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_academy_resources_kind ON academy_resources(kind);
  `);

  pgm.sql(`
    INSERT INTO academy_resources (slug, title, kind, body_markdown, sort_order) VALUES
    ('current-sales-briefing', 'Current Sales Briefing — Fall 2026', 'briefing',
'# Fall 2026 Field Briefing

**Audience:** Minnesota TAE Cohort — active selling season.

## Where the season is

Football uniform acquisition is largely past its useful window for this season. Do not spend calls pitching fall uniform replacement cycles. The field emphasis below is what is winnable now.

## Priority lanes this fall

1. **Letterman Jackets** — football and fall-sport teams are the natural entry. Year-round demand, concentrated late fall and spring. Highest-margin lane.
2. **Boys Basketball** — winter season window is open now. Uniform replacement + practice gear.
3. **Girls Basketball** — same window, same urgency.
4. **Wrestling** — winter season. Warm-ups, singlets, practice gear.
5. **Travel Gear** — warm-ups, hoodies, sweatpants, gear bags. Annual purchase at season start.
6. **Team Apparel** — sideline, coaches, and player packs.
7. **Coaches Gear** — coaches order for themselves too; easy add-on to any pitch.
8. **Team Stores** — 2-week branded store windows for parents and fans; booster fundraising angle.
9. **Relationships for Future Uniform Cycles** — every conversation this fall should plant the seed for next cycle. Ask about replacement cycles and get a follow-up date.

## How to use this briefing

This is a seasonal resource, not a permanent part of certification. The certification modules teach the evergreen fundamentals; this briefing tells you where to aim this season. Revisit it at the start of each season.', 0),

    ('tae-packet', 'TAE Onboarding Packet', 'packet',
'# TUF Academy — TAE Onboarding Packet

Welcome to the team. Everything you need to get started lives here. Work through this packet in order, then complete the certification modules in the Academy.

## Your packet contents

1. **Welcome Letter** — TUF mission and culture principles. (Resources → Welcome to TUF)
2. **Sales Playbook** — the 5-stage pipeline, workload constraints, referral scripts. (Resources → Sales Playbook)
3. **Product Guide** — the four revenue lanes, package pricing, discount rules. (Resources → Product Guide)
4. **TUF Ops Quickstart** — how to run the system: dashboard, mockup gate, order handoff. (Resources → TUF Ops Quickstart)
5. **Certification Checklist** — what must be completed before you are certified. (Resources → Certification Checklist)
6. **Certification Modules** — the Learn → Quiz modules in the Academy tab. These are the certification path.

## Your path to certification

1. Read this packet.
2. Complete every Learn → Quiz module in the Academy tab (Level 1 and Level 2).
3. Complete your HR paperwork and NDA (HR will record this).
4. Complete the practical exercise with your Director.
5. Director sign-off → certification.

## Field resources

- **Training Manuals** — full study manuals for every topic (Resources → Training Manuals).
- **Product Cheat Sheets** — quick product/pricing reference (Resources → Product Cheat Sheets).
- **First Contact Email Template** — proven opener (Resources → First Contact Email Template).
- **Territory Map** — your territory (Resources → Territory Map).

God Bless, and go build your territory.', 1),

    ('welcome-letter', 'Welcome to TUF', 'document',
'# Welcome to TUF Sports Apparel!

Welcome to the Team. We are incredibly excited to have you join us.

TUF (Team Uniforms & Fanwear) is not just a custom sports apparel brand; we are building the operating system for school team apparel and logistics. Our goal is to make custom team ordering, design, and production frictionless for coaches, athletic directors, and team administrators.

## Our Mission

> "To equip every athlete, empower every coach, and simplify custom team operations through elite service and state-of-the-art logistics."

We want coaches to spend their time coaching, not chasing down sizing rosters, collecting checks, or resolving artwork mix-ups. Every tool we build — including TUF Ops — is designed to serve this mission.

## Core Culture Principles

### 1. Servanthood
We serve our clients first. The coach''s peace of mind is our highest benchmark. If we simplify their lives, we win their business for life.

### 2. Operational Discipline
A late uniform is a failed uniform. We honor our commitments. Production deadlines and delivery timelines are non-negotiable.

### 3. Execution Focus
Talking is not selling. Activity creates opportunity. The phone is the most powerful tool in your bag — use it.

### 4. The Four-Order Baseline
Four healthy orders per month, every month. Consistency over size. A TAE who hits four orders a month is a TAE who builds a territory.

### 5. Sales Philosophy
- We sell trust before apparel.
- Relationships compound.
- Four healthy orders beat one lucky order.
- Coaches buy from people.
- Activity creates opportunity.
- Pipeline predicts success.
- The Director QA question: "Can Operations produce this order without contacting the customer again?"', 2),

    ('sales-playbook', 'Sales Playbook', 'playbook',
'# TUF Sales Playbook & Pipeline Process

This guide details the TUF sales methodology, how we qualify accounts, and how to execute our consolidated 5-stage opportunity pipeline.

## The 5-Stage Pipeline Flow

Your opportunity pipeline is streamlined to minimize administrative load, keeping focus on active deals. You must advance deals through these exact stages in TUF Ops:

1. **Lead Engaged**: A target school/program is assigned or self-sourced, and initial outreach (call/email) has begun.
2. **Discovery (Mandatory Gate)**: A detailed discovery meeting is conducted. You must confirm the Decision Maker, Roster Size, Season Timing, and Budget. TUF Ops locks custom mockup requests until these fields are completed.
3. **Mockup Stage**: The mockup request is submitted to our design team and the custom concepts are delivered to the client.
4. **Invoice Sent**: Reviewing options, finalizing package, and sending the digital invoice to the billing contact.
5. **Closed Won / Closed Lost**: Finalizing payment, triggering the order handoff, or documenting loss reasons.

## Pipeline & Workload Constraints

To ensure maximum focus, speed, and responsiveness:

- **25-Account Capacity Cap**: No representative may manage more than 25 active opportunities at any time. If you reach this cap, you must advance, close, or archive existing deals before accepting new leads.
- **Mandatory Discovery Gate**: You are strictly prohibited from submitting mockup requests until the Discovery checklist is completed and logged in TUF Ops.
- **45% Margin Floor**: All deals must hit or exceed a 45% gross margin floor. Commissions are tiered based on realized margin.
- **Midwest Print Buffering**: To support our main production network in Pakistan, we maintain vetted local Midwest textile printers for a 7-day turnaround buffer during peak seasonal crunch.

## Lane Expansion Strategy

Do not stop after winning a single uniform order. Once a coach trusts you with game jerseys:

- **Immediate Pitch**: Pitch the team player packs (Travel Gear) for the same roster.
- **Parent Engagement**: Open a branded Team Store (Fanwear) for parent and fan orders.
- **Athletic Director Pitch**: Use the success of that sport to ask the AD for introductions to other sports programs in the school.

## Ecosystem Referrals

Coaches and athletic directors talk to each other constantly. Leverage this network to generate warm leads:

- **The Post-Delivery Warm Ask**: Upon uniform delivery, ask: "Coach, who is the director or coach in your conference that had the worst uniform delay last year? I''d love to help them resolve that problem."
- **Cross-Sport Referrals**: Once you win Football, ask the coach to walk you down the hall and introduce you to the Basketball or Wrestling coach.

## Defining a Qualified Opportunity (Discovery Checklist)

An account is only qualified as an Active Opportunity when you confirm and enter the following into TUF Ops:

- **Decision Maker**: Contact with the buying authority (Coach, AD, or Booster President).
- **Roster / Roster Size**: Approximate player count.
- **Season/Replacement Cycle**: When their current uniforms are due for replacement.
- **Pricing Alignment**: Agreement that our packages fit their budget limits (respecting the 45% margin floor).', 3),

    ('product-guide', 'Product Guide & Pricing Framework', 'product',
'# Product Guide & Pricing Framework

To win team business, you must understand our products, pricing, and how our four distinct revenue lanes maximize the lifetime value of every school account.

## The Four Revenue Lanes

Every school organization has four distinct purchase lanes. Your goal is to penetrate all four lanes for every account you manage:

**Uniforms  →  Travel Gear  →  Team Store  →  Letterman Jackets**

### 1. Uniforms (Core Lane)
Custom game-day jerseys, pants, shorts, and performance socks for all high school and club sports.
- **Product Options**: Sublimated, tackle twill, or screen-printed uniforms.
- **Cycle**: Uniforms are replaced on a predictable 2-to-3-year cycle.
- **Timing**: Pitch uniforms 4 to 6 months before the season starts.

### 2. Travel Gear (Spirit & Player Packs)
Warm-ups, hoodies, sweatpants, compression gear, and gear bags used by players and coaches on travel days.
- **Product Options**: Embroidered or screen-printed performance fleece and custom bags.
- **Cycle**: Purchased annually at the beginning of each season.

### 3. Team Store (Fanwear)
Custom apparel portals set up for parents, fans, and boosters to buy branded team merchandise.
- **Product Options**: Tees, hats, jackets, and accessories.
- **Cycle**: Open for 2-week windows before each season begins.
- **Revenue model**: Boosters can add fundraising markups to generate team revenue.

### 4. Letterman Jackets
Traditional custom wool and leather varsity jackets.
- **Product Options**: Standard school patches, custom name plaques, and sleeve numbers.
- **Cycle**: Year-round ordering, heavily concentrated in late fall and spring.

## Pricing Guidelines

TUF pricing is structured to be highly competitive while maintaining strong margins.

### Custom Uniform Packages
- **Standard Sublimated Set (Jersey + Shorts/Pants)**: $75.00 – $95.00 per player.
- **Premium Tackle Twill Set**: $120.00 – $150.00 per player.

### Travel Packs (Player Gear packs)
- **Basic Pack (Performance Tee + Hoodie + Shorts)**: $60.00 per pack.
- **Deluxe Pack (Warm-up Jacket + Pants + Bag + Hoodie)**: $110.00 per pack.

### Pricing Approvals
- Any discount exceeding **10%** of standard catalog price requires approval from your State Director.
- Custom package designs or bundle discounts must be verified in the TUF Ops Command Center before sending invoices.', 4),

    ('tuf-ops-quickstart', 'TUF Ops Quickstart', 'quickstart',
'# TUF Ops Software Quickstart Guide

TUF Ops is the operating system for TUF Sports Apparel. It replaces spreadsheets, emails, and manual invoice tracking with an execution-focused pipeline dashboard.

## 1. Navigating Your Dashboard

When you log in, your primary view is the **Action Needed** queue:

- **Opportunities default**: Shows deals that are stalled (no activity in 21 days), have overdue next actions, or are payment-pending.
- **Orders default**: Shows fulfillment items that require review, lack sizing rosters, or are waiting to be sent to vendors.
- **Data Health page**: Provides real-time views on backup metrics and database integrity indicators (restricted to Owner).

## 2. The Mockup Workflow (Mandatory Discovery Gate)

Custom mockups are our strongest conversion tool. To request designs in TUF Ops, you must first pass the **Discovery Gate**:

1. Open the Opportunity and ensure it is in the DISCOVERY stage.
2. Complete all required Discovery fields: **Decision Maker**, **Roster Size**, **Season Timing**, and **Budget**. (TUF Ops blocks requests until these are complete).
3. Once completed, advance the Opportunity to Mockup Stage (MOCKUP_STAGE) and submit the mockup request.
4. Complete the required design fields in the drawer: Sport, Revenue Lane, Design Notes, Needed Items, Urgency / Due Date.
5. Our design team is notified. Once completed, they upload the files directly to the Opportunity.

## 3. Order Handoff & Fulfillment

When an opportunity reaches Closed Won (payment is confirmed), you must immediately trigger the order handoff:

1. Open the Opportunity Detail Page.
2. Under the **Order Handoff** panel, click **Create Order Handoff**.
3. The system pulls the organization name, sport, value, and rep details to create a new order in Orders with a status of NEEDS_REVIEW (renders as Order Created).
4. Operations reviews the sizing rosters and design assets, then advances the order:
   - Order Created → Vendor Ready (assigned to Pakistani vendor).
   - Vendor Ready → In Production (production started).
   - In Production → Completed (shipped to school).
   - If a blocker arises (e.g. roster mismatch), mark the order as Blocked / On Hold to highlight it on the Director/Ops dashboard.', 5),

    ('certification-checklist', 'Certification Checklist', 'checklist',
'# TUF Academy Certification Checklist

To ensure all representatives and directors maintain absolute operational excellence, you must complete the onboarding certification checklist below.

## TAE Onboarding Checklist (Sales Reps)

### Phase 1: Philosophy & Systems Welcome
- [ ] Read and understand the TUF Welcome Letter and Mission.
- [ ] Log in successfully to TUF Ops using your assigned PIN.
- [ ] Complete profile setup in TUF Ops.

### Phase 2: Product & Pricing Mastery
- [ ] Review the Product Guide.
- [ ] Score 100% on the product and pricing verbal review with your State Director.
- [ ] Memorize package pricing boundaries and standard discount thresholds.

### Phase 3: Sales Execution
- [ ] Read the TUF Sales Playbook.
- [ ] Practice a mock discovery call with your State Director.
- [ ] Understand the 5-stage opportunity pipeline criteria and Mandatory Discovery Gate.
- [ ] Maintain compliance with the 25-account workload capacity cap.

### Phase 4: System Operations
- [ ] Complete the TUF Ops Quickstart Guide review.
- [ ] Create a mock opportunity, request a mockup, and log an activity successfully in TUF Ops.
- [ ] Successfully execute a Closed Won-to-Order handoff.

## Certification in TUF Ops

The Academy tab tracks this automatically:

- **Certification modules** — complete every Learn → Quiz module (Level 1 and Level 2).
- **HR paperwork** — HR records your activation form and NDA.
- **Practical exercise** — completed with your Director.
- **Director sign-off** — your Director approves your readiness.

Only when all four are complete does the system certify you.', 6),

    ('training-manuals', 'Training Manuals', 'manuals',
'Full study manuals for every certification topic. These are the deep-dive companion to the certification modules.

- [Manual 1 — TUF Philosophy](/training/TRAINING_MANUAL_01_PHILOSOPHY.md)
- [Manual 2 — Prospecting](/training/TRAINING_MANUAL_02_PROSPECTING.md)
- [Manual 3 — Discovery](/training/TRAINING_MANUAL_03_DISCOVERY.md)
- [Manual 4 — Proposal](/training/TRAINING_MANUAL_04_PROPOSAL.md)
- [Manual 5 — Order Handoff](/training/TRAINING_MANUAL_05_ORDER_HANDOFF.md)
- [Manual 6 — Product Knowledge](/training/TRAINING_MANUAL_06_PRODUCT_KNOWLEDGE.md)
- [Complete manual (all modules)](/training/TRAINING_MANUAL_COMPLETE.md)

Study guide versions (HTML):

- [ACAD-101 TUF Philosophy](/training/ACAD-101_TUF_Philosophy.html)
- [ACAD-102 Prospecting](/training/ACAD-102_Prospecting.html)
- [ACAD-103 Discovery](/training/ACAD-103_Discovery.html)
- [ACAD-104 Proposal](/training/ACAD-104_Proposal.html)
- [ACAD-105 Order Handoff](/training/ACAD-105_Order_Handoff.html)
- [ACAD-106 Product Knowledge](/training/ACAD-106_Product_Knowledge.html)', 7),

    ('product-cheat-sheets', 'Product Cheat Sheets', 'product',
'Quick reference for products and pricing. The full product guide is in Resources → Product Guide.

- [Product cheat sheets](/training/product-cheat-sheets.md)', 8),

    ('first-contact-email', 'First Contact Email Template', 'template',
'Proven first-contact email template for cold outreach.

- [First contact email template](/training/FIRST_CONTACT_EMAIL_TEMPLATE.md)', 9),

    ('territory-map', 'Territory Map', 'map',
'Your Minnesota territory map with zones, school markers, and search.

- [Open the territory map](/training/territorymap_tuf_2026.png)
- [Interactive map](/territory/map)', 10)
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      kind = EXCLUDED.kind,
      body_markdown = EXCLUDED.body_markdown,
      external_url = EXCLUDED.external_url,
      sort_order = EXCLUDED.sort_order,
      is_active = true,
      updated_at = NOW();
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS academy_resources CASCADE;`);
};
