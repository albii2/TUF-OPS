#!/usr/bin/env python3
"""
Generate ultra-realistic 60-day mock data seed for TUF Ops.
Uses actual MN school data from the CSV to create organizations, opportunities,
orders, and activities.

Run from repo root:
  python3 scripts/generate_mock_data.py
"""

import csv
import json
import random
import math
from datetime import datetime, timedelta
from collections import defaultdict, OrderedDict

random.seed(42)  # Reproducible

BASE_DATE = datetime(2026, 8, 26)  # Current date
START_DATE = BASE_DATE - timedelta(days=60)  # 60 days ago

# ── Rep Configuration ──────────────────────────────────────────────────────

REP_CONFIG = {
    'Josh Hoffman': {
        'id': 'rep-josh-hoffman',
        'pin': '5080',
        'zone': 'metro',
        'tier_focus': '1-2',
        'total_schools': 55,
        'org_count': 22,
        'opp_count': 18,
        'order_count': 12,
        'order_revenue': 142000,
        'prospecting_activities': 140,
        'follow_up_activities': 35,
        'product_mix': {'UNIFORM': 0.50, 'TRAVEL_GEAR': 0.05, 'TEAM_STORE': 0.30, 'LETTERMAN': 0.15},
        'top_schools': ['Edina High School', 'Wayzata High School', 'Minnetonka High School', 'Cretin-Derham Hall High School'],
        'performance': 'top',
    },
    'Josh Hoffman': {
        'id': 'rep-josh-hoffman',
        'pin': '5219',
        'zone': 'metro',
        'tier_focus': '2-3',
        'total_schools': 71,
        'org_count': 16,
        'opp_count': 12,
        'order_count': 8,
        'order_revenue': 73500,
        'prospecting_activities': 85,
        'follow_up_activities': 20,
        'product_mix': {'UNIFORM': 0.55, 'TRAVEL_GEAR': 0.02, 'TEAM_STORE': 0.28, 'LETTERMAN': 0.15},
        'top_schools': ['Stillwater Area High School', 'White Bear Lake Area High School', 'Roseville Area High School'],
        'performance': 'ramping',
    },
    'David Lundberg': {
        'id': 'rep-david-lundberg',
        'pin': '6187',
        'zone': 'south',
        'tier_focus': '2-3',
        'total_schools': 48,
        'org_count': 24,
        'opp_count': 15,
        'order_count': 10,
        'order_revenue': 98600,
        'prospecting_activities': 110,
        'follow_up_activities': 28,
        'product_mix': {'UNIFORM': 0.45, 'TRAVEL_GEAR': 0.05, 'TEAM_STORE': 0.35, 'LETTERMAN': 0.15},
        'top_schools': ['Rochester Mayo High School', 'Lakeville North High School', 'Prior Lake High School'],
        'performance': 'solid',
    },
    'David Lundberg': {
        'id': 'rep-david-lundberg',
        'pin': '6243',
        'zone': 'west',
        'tier_focus': 'all',
        'total_schools': 67,
        'org_count': 14,
        'opp_count': 8,
        'order_count': 5,
        'order_revenue': 38200,
        'prospecting_activities': 60,
        'follow_up_activities': 12,
        'product_mix': {'UNIFORM': 0.70, 'TRAVEL_GEAR': 0.05, 'TEAM_STORE': 0.15, 'LETTERMAN': 0.10},
        'top_schools': ['Moorhead High School', 'St. Cloud Tech High School', 'Bemidji High School'],
        'performance': 'building',
    },
    'Primeau Hill': {
        'id': 'rep-primeau-hill',
        'pin': '7288',
        'zone': 'metro',
        'tier_focus': 'director',
        'total_schools': 32,
        'org_count': 18,
        'opp_count': 6,
        'order_count': 4,
        'order_revenue': 52000,
        'prospecting_activities': 40,
        'follow_up_activities': 8,
        'product_mix': {'UNIFORM': 0.45, 'TRAVEL_GEAR': 0.10, 'TEAM_STORE': 0.30, 'LETTERMAN': 0.15},
        'top_schools': ['Shoot 360 (Lino Lakes)', 'Northwestern — St. Paul', 'Bethany Lutheran College'],
        'performance': 'director',
        'is_director': True,
    },
}

DIRECTOR_NAME = 'Primeau Hill'
OWNER_NAME = 'A Bradshaw'

# ── Load CSV ────────────────────────────────────────────────────────────────

def load_schools():
    with open('apps/web/src/assets/tuf_mn_leads_final.csv') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return rows

def extract_city(address):
    """Extract city name from address field using zip code lookup.
    Uses zip code from parsed_zip column as ground truth.
    """
    # This function is called with the full school row in main()
    # but also standalone. We'll use a simpler heuristic.
    if not address:
        return 'Unknown'
    import re
    # Many addresses follow: "street city, MN zip" or "street city , MN zip"
    # Try to isolate city by finding the last word sequence before ", MN"
    m = re.search(r'\s*,?\s*MN\b', address)
    if not m:
        return 'Unknown'

    before = address[:m.start()].strip()
    # Remove trailing PO Box patterns
    before = re.sub(r'\s*PO\s+Box\s+\d+.*$', '', before, flags=re.I)

    # Known multi-word MN cities (most common)
    multi_word = {
        'st. paul', 'st paul', 'saint paul', 'new hope', 'new prague',
        'new ulm', 'new london', 'new brighton', 'new richland',
        'prior lake', 'maple grove', 'forest lake', 'spring lake park',
        'elk river', 'pine city', 'blue earth', 'red wing',
        'red lake', 'redwood falls', 'white bear lake', 'big lake',
        'little falls', 'long prairie', 'cold spring',
        'cottage grove', 'brooklyn park', 'brooklyn center',
        'golden valley', 'apple valley', 'eden prairie', 'eden valley',
        'mendota heights', 'inver grove heights', 'oak park heights',
        'columbia heights', 'circle pines', 'lino lakes', 'north branch',
        'south st. paul', 'west st. paul', 'north st. paul',
        'st. louis park', 'st. anthony', 'st. michael', 'st. francis',
        'st. charles', 'st. james', 'st. peter', 'st. clair',
        'st. cloud', 'park rapids', 'pelican rapids', 'sauk rapids',
        'sauk centre', 'thief river falls', 'international falls',
        'albert lea', 'belle plaine', 'cannon falls', 'pine island',
        'detroit lakes', 'pequot lakes',
        'east grand forks', 'two harbors', 'mounds view',
        'norwood young america', 'howard lake', 'maple lake',
        'rush city', 'lake city', 'lake crystal',
        'st. anthony village', 'south saint paul',
        'north saint paul', 'west saint paul',
        'st. michael-albertville', 'st. louis',
        'cannon falls', 'lakeville', 'minneapolis',
        'inver grove', 'new ulm', 'prior lake',
        'st. paul', 'white bear', 'saint paul',
        'willmar', 'moorhead', 'bemidji', 'brainerd',
    }

    words = before.split()
    # Try 3-word, 2-word, then 1-word matches
    for n in range(3, 0, -1):
        if len(words) >= n:
            candidate = ' '.join(words[-n:]).lower().rstrip('.').rstrip(',')
            if candidate in multi_word or any(f'{candidate} {x}' in multi_word for x in ['', 'heights', 'park', 'lake', 'falls', 'rapids', 'village']):
                return ' '.join(words[-n:]).rstrip('.').rstrip(',')

    # Fallback: take the last word that looks like a place name
    street_words = {'ave', 'ave.', 'st', 'st.', 'blvd', 'blvd.', 'dr', 'dr.',
                    'rd', 'rd.', 'ln', 'ln.', 'ct', 'ct.', 'way', 'pkwy',
                    'trail', 'circle', 'hwy', 'hwy.', 'highway', 'street',
                    'avenue', 'drive', 'road', 'boulevard', 'lane', 'parkway',
                    'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw',
                    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th',
                    '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th',
                    '18th', '19th', '20th', '21st', '22nd', '23rd', '24th',
                    'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
                    'seventh', 'eighth', 'ninth', 'tenth',
                    'n.', 's.', 'e.', 'w.', 'n.e.', 's.e.', 'n.w.', 's.w.',
                    'fairfield', 'bunker', 'larpenteur', 'fernbrook',
                    'pioneer', 'braddock', 'woodlane', 'jamison',
                    'shumway', 'conifer', 'olinda', 'franklin'}
    for w in reversed(words):
        clean = w.lower().rstrip('.').rstrip(',')
        if clean.isdigit() or clean in street_words:
            continue
        return w.rstrip('.').rstrip(',')
    return 'Unknown'

# ── Zone Mapping ────────────────────────────────────────────────────────────

ZONE_MAP = {
    'TUF Metro': 'metro',
    'TUF South': 'south',
    'TUF West': 'west',
    'TUF North': 'north',
}

# ── Helpers ─────────────────────────────────────────────────────────────────

SPORTS = ['Football', 'Basketball', 'Baseball', 'Softball', 'Volleyball', 'Hockey', 'Soccer', 'Track', 'Wrestling', 'Lacrosse', 'Cheer']
LANES = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN']
STAGES_ACTIVE = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT']
STAGES_ALL = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON', 'CLOSED_LOST']
PRODUCTION_STATUSES = ['NEEDS_REVIEW', 'READY_FOR_VENDOR', 'IN_PRODUCTION', 'BLOCKED', 'COMPLETED']
VENDORS = ['BSN Sports', 'Eastbay/Champion', 'Under Armour All-American', 'Adidas Team', 'Nike Team', 'Augusta Sportswear']

def random_date(start_offset_days, end_offset_days):
    """Random date between (BASE_DATE - end_offset) and (BASE_DATE - start_offset)."""
    start = BASE_DATE - timedelta(days=end_offset_days)
    end = BASE_DATE - timedelta(days=start_offset_days)
    delta = (end - start).days
    if delta <= 0:
        return start
    days = random.randint(0, int(delta))
    return start + timedelta(days=days)

def fmt_date(d):
    return d.strftime('%Y-%m-%d')

def generate_id(prefix, num):
    return f'{prefix}-{num:04d}'

def pick_sport_for_school(school, rep_config):
    """Pick a realistic sport based on school offerings."""
    fb = school.get('football_offered', 'No') == 'Yes'
    bb = school.get('basketball_offered', 'No') == 'Yes'
    ba = school.get('baseball_offered', 'No') == 'Yes'
    hk = school.get('hockey_offered', 'No') == 'Yes'

    available = []
    if fb:
        available.append('Football')
    if bb:
        available.append('Basketball')
    if ba:
        available.append('Baseball')
    if hk:
        available.append('Hockey')

    # Add universal sports
    available.extend(['Softball', 'Volleyball', 'Soccer', 'Track', 'Wrestling', 'Lacrosse', 'Cheer'])

    # Weight based on rep profile
    weights = []
    for s in available:
        if s == 'Football' and fb:
            weights.append(10)
        elif s == 'Basketball' and bb:
            weights.append(9)
        elif s == 'Hockey' and hk:
            weights.append(7)
        elif s == 'Baseball' and ba:
            weights.append(6)
        elif s in ('Volleyball', 'Softball'):
            weights.append(5)
        elif s == 'Soccer':
            weights.append(4)
        else:
            weights.append(3)

    total = sum(weights)
    r = random.random() * total
    cumulative = 0
    for s, w in zip(available, weights):
        cumulative += w
        if r <= cumulative:
            return s
    return available[-1] if available else 'Basketball'

def pick_season(sport):
    seasons = {
        'Football': 'FA', 'Basketball': 'WI', 'Baseball': 'SP',
        'Softball': 'SP', 'Volleyball': 'FA', 'Hockey': 'WI',
        'Soccer': 'FA', 'Track': 'SP', 'Wrestling': 'WI',
        'Lacrosse': 'SP', 'Cheer': 'FA',
    }
    return seasons.get(sport, 'FA')

def pick_lane(rep_config):
    """Pick a revenue lane based on rep's product mix."""
    mix = rep_config['product_mix']
    r = random.random()
    cumulative = 0
    for lane in LANES:
        cumulative += mix.get(lane, 0.25)
        if r <= cumulative:
            return lane
    return 'UNIFORM'

def pick_stage_active():
    """Pick a non-closed stage weighted toward earlier stages."""
    weights = {'LEAD_ENGAGED': 0.35, 'DISCOVERY': 0.30, 'MOCKUP_STAGE': 0.20, 'INVOICE_SENT': 0.15}
    r = random.random()
    cumulative = 0
    for stage, w in weights.items():
        cumulative += w
        if r <= cumulative:
            return stage
    return 'LEAD_ENGAGED'

def estimate_deal_value(school, lane, rep_config):
    """Estimate a realistic deal value based on school tier and lane."""
    tier = school.get('tuf_priority', 'Tier 3')
    enrollment = int(school.get('enrollment', 500)) if school.get('enrollment', '').replace('.', '').isdigit() else 500

    base = {
        'UNIFORM': 8500,
        'TEAM_STORE': 5500,
        'TRAVEL_GEAR': 4200,
        'LETTERMAN': 3800,
    }.get(lane, 6000)

    # Tier multiplier
    tier_mult = {'Tier 1': 1.5, 'Tier 2': 1.0, 'Tier 3': 0.65}.get(tier, 1.0)

    # Enrollment adjustment
    enroll_mult = min(1.5, max(0.5, enrollment / 800))

    value = base * tier_mult * enroll_mult
    # Add noise
    value *= random.uniform(0.8, 1.2)
    return round(value / 500) * 500  # Round to nearest 500

def generate_next_action(stage, lane, sport):
    actions = {
        'LEAD_ENGAGED': [
            f'Send introductory email and TUF catalog for {sport}',
            f'Follow up with AD about {sport} {lane.replace("_", " ").title()} needs',
            f'Call to schedule discovery meeting for {sport}',
            f'Send TUF capabilities deck highlighting {sport} programs',
        ],
        'DISCOVERY': [
            f'Schedule product showcase for {sport} {lane.replace("_", " ").title()}',
            f'Send sizing guide and fabric samples for {sport}',
            f'Provide pricing proposal options for {sport}',
            f'Follow up on {sport} roster count for accurate quote',
        ],
        'MOCKUP_STAGE': [
            f'Send mockup designs for {sport} {lane.replace("_", " ").title()} approval',
            f'Revise mockup based on coach feedback for {sport}',
            f'Finalize design and send for production approval',
            f'Schedule mockup review call with {sport} coach',
        ],
        'INVOICE_SENT': [
            f'Follow up on {sport} invoice – awaiting payment',
            f'Send payment link reminder for {sport} order',
            f'Confirm PO number for {sport} order processing',
            f'Address any invoice questions from AD for {sport}',
        ],
    }
    return random.choice(actions.get(stage, ['Follow up on opportunity']))

def activity_message(entity_type, entity_name, stage_or_status, lane, sport, rep_name):
    """Generate a realistic activity message."""
    types = {
        'prospecting': [
            f'Initial outreach call placed to {entity_name} AD regarding {sport}',
            f'Introductory email sent to {entity_name} introducing TUF {lane.replace("_", " ").title()} program',
            f'Voicemail left for AD at {entity_name} – will follow up in 3 days',
            f'Connected with {entity_name} athletic department about upcoming {sport} season',
            f'Research completed on {entity_name} {sport} program – identified decision maker',
            f'Sent TUF capabilities overview to {entity_name}',
            f'Cold email sent to AD at {entity_name} highlighting TUF uniform program',
            f'LinkedIn connection request sent to {entity_name} AD',
            f'Left voicemail for {entity_name} head {sport} coach',
        ],
        'discovery': [
            f'Discovery meeting scheduled with {entity_name} for {sport} {lane.replace("_", " ").title()}',
            f'Discovery call completed – AD expressed interest in {lane.replace("_", " ").title()} for {sport}',
            f'Sent product samples and sizing guide to {entity_name} for {sport}',
            f'Discussed budget and timeline with {entity_name} AD for {sport}',
            f'Shared previous season {lane.replace("_", " ").title()} examples with {entity_name}',
            f'Roster count confirmed at {entity_name} for {sport} – {random.randint(25, 65)} athletes',
            f'Walked {entity_name} through TUF design process for {sport}',
        ],
        'mockup': [
            f'Mockup designs sent to {entity_name} for {sport} {lane.replace("_", " ").title()} review',
            f'Coach requested color revision on {sport} {lane.replace("_", " ").title()} mockup',
            f'Mockup approved by {entity_name} – moving to invoice stage',
            f'Design team created 3 concepts for {entity_name} {sport} {lane.replace("_", " ").title()}',
            f'Revisions submitted for {entity_name} {sport} mockup – awaiting final approval',
            f'Logo placement confirmed on {entity_name} {sport} {lane.replace("_", " ").title()}',
        ],
        'invoice': [
            f'Invoice #{random.randint(1100, 9999)} sent to {entity_name} for {sport} {lane.replace("_", " ").title()}',
            f'Payment terms discussed with {entity_name} – Net 30',
            f'Invoice viewed by {entity_name} AD – awaiting PO',
            f'Sent updated invoice to {entity_name} with revised quantities',
            f'Purchase order received from {entity_name} for {sport}',
        ],
        'closed': [
            f'Deal closed! {entity_name} signed for {sport} {lane.replace("_", " ").title()}',
            f'Order confirmed for {entity_name} – moving to production',
            f'Payment received from {entity_name} for {sport} order',
            f'Contract executed with {entity_name} for {sport} {lane.replace("_", " ").title()}',
            f'Welcome to TUF! {entity_name} onboarded for {sport}',
        ],
        'production': [
            f'Order submitted to vendor for {entity_name} {sport}',
            f'Artwork finalized for {entity_name} {sport} order',
            f'Production update: {entity_name} order is in progress',
            f'Quality check completed for {entity_name} {sport} order',
            f'Shipping label created for {entity_name} {sport} order',
            f'Order delivered to {entity_name} – awaiting confirmation',
        ],
        'follow_up': [
            f'Follow-up call to {entity_name} regarding {sport} proposal',
            f'Sent thank-you email after discovery meeting with {entity_name}',
            f'Checked in with {entity_name} AD – no update yet on {sport} decision',
            f'Monthly touchpoint with {entity_name} – discussed upcoming {sport} needs',
            f'Nudged {entity_name} on pending {sport} decision',
            f'Reached out to {entity_name} about additional {lane.replace("_", " ").title()} options',
        ],
        'director': [
            f'Director review: approved {rep_name}\'s proposal for {entity_name}',
            f'Director override: flagged {entity_name} {sport} order for review',
            f'Director checked in with {entity_name} AD – reinforced TUF commitment',
        ],
    }
    return random.choice(types.get('prospecting', types['prospecting']))

# ── Main Generator ──────────────────────────────────────────────────────────

def main():
    all_schools = load_schools()
    print(f'Loaded {len(all_schools)} schools from CSV')

    # Group schools by rep
    schools_by_rep = defaultdict(list)
    for s in all_schools:
        rep = s['assigned_rep_name']
        schools_by_rep[rep].append(s)

    org_counter = 1
    opp_counter = 1
    order_counter = 1
    act_counter = 1

    organizations = []
    opportunities = []
    orders = []
    activities = []

    # Track which orgs are created per school name (to avoid duplicates)
    created_org_schools = set()

    # ── Generate per rep ──────────────────────────────────────────────────

    for rep_name, config in REP_CONFIG.items():
        available = schools_by_rep.get(rep_name, [])
        # Shuffle for variety
        random.shuffle(available)

        # Select schools for this rep
        selected = available[:config['org_count']]
        org_count_for_rep = len(selected)

        # Determine which get orders, opportunities
        order_schools = set()
        opp_only_schools = set()
        untouched_schools = set()

        # Pick order schools (the ones with closed deals)
        top_picks = [s for s in selected if s['school_name'] in config['top_schools']]
        remaining = [s for s in selected if s['school_name'] not in config['top_schools']]
        random.shuffle(remaining)

        # Assign top picks to orders first
        order_candidates = top_picks[:] + remaining
        order_schools_list = order_candidates[:config['order_count']]
        order_schools = {s['school_name']: s for s in order_schools_list}

        # Some order schools also get active opportunities (cross-sell)
        order_school_names = list(order_schools.keys())
        random.shuffle(order_school_names)
        active_opps_needed = config['opp_count']
        # ~40% of active opps come from schools that already have orders
        cross_sell_count = min(len(order_school_names), max(1, active_opps_needed // 3))
        cross_sell_schools = set(order_school_names[:cross_sell_count])

        # Remaining active opps from new schools
        remaining_active_needed = active_opps_needed - cross_sell_count
        rest = [s for s in selected if s['school_name'] not in order_schools]
        random.shuffle(rest)
        opp_only_schools_list = rest[:remaining_active_needed]
        opp_only_schools = {s['school_name']: s for s in opp_only_schools_list}
        untouched_schools_list = rest[remaining_active_needed:] if remaining_active_needed < len(rest) else []

        untouched_schools = {s['school_name']: s for s in untouched_schools_list}

        # ── Create Organizations ──────────────────────────────────────────
        for school in selected:
            school_name = school['school_name']
            if school_name in created_org_schools:
                continue
            created_org_schools.add(school_name)

            city = extract_city(school['address'])
            zone = ZONE_MAP.get(school['tuf_zone'], 'metro')
            tier = school.get('tuf_priority', 'UNASSIGNED')

            # Determine coverage status
            if school_name in order_schools:
                coverage = 'ACTIVE'
            elif school_name in opp_only_schools:
                coverage = 'CONTACTED'
            else:
                coverage = 'UNTOUCHED'

            # Pipeline value
            if school_name in order_schools:
                pipeline = 0
            elif school_name in opp_only_schools:
                pipeline = estimate_deal_value(school, 'UNIFORM', config)
            else:
                pipeline = 0

            # Status
            if coverage == 'ACTIVE':
                status = 'ACTIVE'
            elif coverage == 'CONTACTED':
                status = 'WATCH'
            else:
                status = 'NEW'

            # Priority
            tier_priority = {'Tier 1': 'HIGH', 'Tier 2': 'MEDIUM', 'Tier 3': 'LOW'}.get(tier, 'LOW')

            # Lane statuses
            lane_statuses = {}
            for lane in LANES:
                if school_name in order_schools and lane == 'UNIFORM':
                    lane_statuses[lane] = {
                        'status': 'WON',
                        'estimatedValue': estimate_deal_value(school, lane, config),
                        'activeOpportunityCount': 0,
                        'nextAction': 'Monitor delivery and follow up for reorder',
                    }
                elif school_name in opp_only_schools:
                    if random.random() < 0.4:
                        lane_statuses[lane] = {
                            'status': 'ACTIVE',
                            'estimatedValue': estimate_deal_value(school, lane, config),
                            'activeOpportunityCount': 1,
                            'nextAction': f'Progress {lane.replace("_", " ").title()} opportunity',
                        }
                    else:
                        lane_statuses[lane] = {
                            'status': 'OPEN',
                            'estimatedValue': estimate_deal_value(school, lane, config),
                            'activeOpportunityCount': 0,
                            'nextAction': f'Explore {lane.replace("_", " ").title()} for upcoming season',
                        }
                else:
                    lane_statuses[lane] = {
                        'status': 'OPEN',
                        'estimatedValue': estimate_deal_value(school, lane, config),
                        'activeOpportunityCount': 0,
                        'nextAction': 'Initial outreach needed',
                    }

            # Next action
            if coverage == 'UNTOUCHED':
                next_action = f'Initial outreach to athletic director'
            elif coverage == 'CONTACTED':
                next_action = f'Follow up on active opportunity'
            else:
                next_action = 'Monitor order fulfillment and plan re-engagement'

            # Last activity date
            if coverage == 'ACTIVE':
                last_activity = fmt_date(random_date(0, 15))
            elif coverage == 'CONTACTED':
                last_activity = fmt_date(random_date(0, 35))
            else:
                last_activity = fmt_date(BASE_DATE)

            org_id = generate_id('org', org_counter)
            org_counter += 1

            # Determine director
            director = 'Primeau Hill'  # All report to Primeau

            org = {
                'id': org_id,
                'name': school_name,
                'city': city,
                'state': 'MN',
                'assignedRep': rep_name,
                'assignedDirector': director,
                'territory': zone,
                'schoolPhone': school.get('phone_number', ''),
                'athleticDirectorName': school.get('activities_director_name', '').replace(' Email me Principal', '').replace(' Email me Assistant Activities Director', '').replace(' Email me AD Administrative Assistant', '').replace(' xxx-xxx-xxxx', '')[:50],
                'athleticDirectorEmail': school.get('activities_director_email', ''),
                'athleticDirectorPhone': school.get('activities_director_phone_number', ''),
                'headCoachName': '',
                'headCoachEmail': '',
                'headCoachPhone': '',
                'coverageStatus': coverage,
                'priority': tier_priority,
                'pipelineValue': pipeline,
                'status': status,
                'nextAction': next_action,
                'lastActivity': last_activity,
                'leadTier': tier.replace(' ', '_').upper() if tier else 'UNASSIGNED',
                'laneStatuses': lane_statuses,
                'expansionRecommendation': f'Target {random.choice(["Football", "Basketball", "Volleyball"])} {random.choice(["UNIFORM", "TEAM_STORE"])} for next season',
            }
            organizations.append(org)

        # ── Create Closed-Won Orders and their Opportunities ──────────────
        rep_order_revenue = config['order_revenue']
        order_values = []
        total = 0

        for school_name, school in order_schools.items():
            lane = pick_lane(config)
            sport = pick_sport_for_school(school, config)
            value = estimate_deal_value(school, lane, config)

            # Scale to hit revenue target
            order_values.append({'school_name': school_name, 'school': school, 'lane': lane, 'sport': sport, 'value': value})
            total += value

        # Adjust values to match target revenue
        if order_values and total > 0:
            scale_factor = rep_order_revenue / total
            for ov in order_values:
                ov['value'] = max(2000, round(ov['value'] * scale_factor / 500) * 500)

        # Create orders and their closed-won opportunities
        for ov in order_values:
            school = ov['school']
            school_name = ov['school_name']
            lane = ov['lane']
            sport = ov['sport']
            value = ov['value']
            season = pick_season(sport)

            # Find the organization
            org = next((o for o in organizations if o['name'] == school_name), None)
            if not org:
                continue

            opp_id = generate_id('opp', opp_counter)
            opp_counter += 1
            order_id = generate_id('ord', order_counter)
            order_counter += 1

            created_date = fmt_date(random_date(15, 60))
            closed_date = fmt_date(random_date(0, 15))
            due_date = fmt_date(BASE_DATE + timedelta(days=random.randint(30, 90)))

            # Production status distribution
            prod_roll = random.random()
            if prod_roll < 0.15:
                prod_status = 'NEEDS_REVIEW'
            elif prod_roll < 0.40:
                prod_status = 'READY_FOR_VENDOR'
            elif prod_roll < 0.70:
                prod_status = 'IN_PRODUCTION'
            elif prod_roll < 0.80:
                prod_status = 'BLOCKED'
            else:
                prod_status = 'COMPLETED'

            # Opportunity
            opp = {
                'id': opp_id,
                'title': f'{school_name} - {sport} {lane.replace("_", " ").title()}',
                'organizationId': org['id'],
                'organizationName': school_name,
                'lanes': [lane],
                'sport': sport,
                'season': season,
                'stage': 'CLOSED_WON',
                'value': value,
                'assignedRep': rep_name,
                'assignedDirector': 'Primeau Hill',
                'estimatedValue': value,
                'nextAction': f'Monitor {lane.replace("_", " ").title()} delivery and plan re-engagement',
                'nextActionDueDate': fmt_date(BASE_DATE + timedelta(days=14)),
                'lastActivity': closed_date,
                'createdAt': created_date,
                'updatedAt': closed_date,
                'dueDate': due_date,
                'orderId': order_id,
                'closeProbability': 100,
            }
            opportunities.append(opp)

            # Order
            vendor = random.choice(VENDORS)
            order_status_map = {
                'NEEDS_REVIEW': 'ORDER_CREATED',
                'READY_FOR_VENDOR': 'ARTWORK_FINALIZED',
                'IN_PRODUCTION': 'IN_PRODUCTION',
                'BLOCKED': 'BLOCKED_ON_HOLD',
                'COMPLETED': 'COMPLETED',
            }

            missing_info = []
            if prod_status == 'NEEDS_REVIEW':
                missing_info = ['Artwork pending approval', 'Final roster count']
            elif prod_status == 'BLOCKED':
                missing_info = ['Missing artwork files', 'Logo resolution insufficient']

            ord = {
                'id': order_id,
                'organizationId': org['id'],
                'organizationName': school_name,
                'opportunityId': opp_id,
                'lane': lane,
                'value': value,
                'productionStatus': prod_status,
                'orderStage': order_status_map.get(prod_status, 'ORDER_CREATED'),
                'title': f'{school_name} - {sport} {lane.replace("_", " ").title()}',
                'sport': sport,
                'quantity': random.randint(30, 120),
                'dueDate': fmt_date(BASE_DATE + timedelta(days=random.randint(14, 60))),
                'assignedRep': rep_name,
                'assignedDirector': 'Primeau Hill',
                'nextAction': 'Review order details and confirm production timeline' if prod_status == 'NEEDS_REVIEW' else 'Monitor production progress',
                'paymentStatus': 'PAID' if random.random() < 0.8 else 'PENDING',
                'artworkStatus': 'APPROVED' if prod_status not in ('NEEDS_REVIEW', 'BLOCKED') else 'PENDING',
                'vendorStatus': 'CONFIRMED' if prod_status in ('READY_FOR_VENDOR', 'IN_PRODUCTION') else 'PENDING',
                'shippingStatus': 'PENDING',
                'customerContact': school.get('activities_director_name', '').replace(' Email me Principal', '')[:50],
                'createdDate': created_date,
                'createdAt': created_date,
                'updatedAt': closed_date,
                'completedDate': fmt_date(BASE_DATE - timedelta(days=random.randint(5, 20))) if prod_status == 'COMPLETED' else None,
                'riskStatus': 'yellow' if prod_status == 'BLOCKED' else ('green' if prod_status == 'COMPLETED' else 'green'),
                'activityIds': [],
                'missingInfo': missing_info,
                'vendor': vendor,
                'vendorNotes': f'Standard {lane.replace("_", " ").title()} order for {sport}' if prod_status != 'BLOCKED' else 'Customer requested custom patch – awaiting vector file',
            }
            orders.append(ord)

        # ── Create Active Opportunities ───────────────────────────────────
        # First from cross-sell (schools that already have orders)
        for school_name in cross_sell_schools:
            school = order_schools.get(school_name) or opp_only_schools.get(school_name)
            if not school:
                continue
            org = next((o for o in organizations if o['name'] == school_name), None)
            if not org:
                continue

            lane = pick_lane(config)
            # Don't use the same lane as the won deal
            existing_order = next((o for o in orders if o['organizationId'] == org['id']), None)
            if existing_order and lane == existing_order['lane']:
                other_lanes = [l for l in LANES if l != lane]
                lane = random.choice(other_lanes)
            sport = pick_sport_for_school(school, config)
            stage = pick_stage_active()
            value = estimate_deal_value(school, lane, config)
            season = pick_season(sport)
            prob = {'LEAD_ENGAGED': 15, 'DISCOVERY': 35, 'MOCKUP_STAGE': 60, 'INVOICE_SENT': 80}.get(stage, 25)
            created_date = fmt_date(random_date(5, 45))
            last_activity = fmt_date(random_date(0, 15))

            opp_id = generate_id('opp', opp_counter)
            opp_counter += 1

            opp = {
                'id': opp_id,
                'title': f'{school_name} - {sport} {lane.replace("_", " ").title()}',
                'organizationId': org['id'],
                'organizationName': school_name,
                'lanes': [lane],
                'sport': sport,
                'season': season,
                'stage': stage,
                'value': value,
                'assignedRep': rep_name,
                'assignedDirector': 'Primeau Hill',
                'estimatedValue': value,
                'nextAction': generate_next_action(stage, lane, sport),
                'nextActionDueDate': fmt_date(BASE_DATE + timedelta(days=random.randint(1, 10))),
                'lastActivity': last_activity,
                'createdAt': created_date,
                'updatedAt': last_activity,
                'dueDate': fmt_date(BASE_DATE + timedelta(days=random.randint(14, 60))),
                'orderId': None,
                'closeProbability': prob,
            }
            opportunities.append(opp)

        # Then from opp-only schools
        for school_name, school in opp_only_schools.items():
            # One opportunity per opp-only school
            org = next((o for o in organizations if o['name'] == school_name), None)
            if not org:
                continue

            lane = pick_lane(config)
            sport = pick_sport_for_school(school, config)
            stage = pick_stage_active()
            value = estimate_deal_value(school, lane, config)
            season = pick_season(sport)
            prob = {'LEAD_ENGAGED': 15, 'DISCOVERY': 35, 'MOCKUP_STAGE': 60, 'INVOICE_SENT': 80}.get(stage, 25)
            created_date = fmt_date(random_date(5, 55))
            last_activity = fmt_date(random_date(0, 20))

            opp_id = generate_id('opp', opp_counter)
            opp_counter += 1

            opp = {
                'id': opp_id,
                'title': f'{school_name} - {sport} {lane.replace("_", " ").title()}',
                'organizationId': org['id'],
                'organizationName': school_name,
                'lanes': [lane],
                'sport': sport,
                'season': season,
                'stage': stage,
                'value': value,
                'assignedRep': rep_name,
                'assignedDirector': 'Primeau Hill',
                'estimatedValue': value,
                'nextAction': generate_next_action(stage, lane, sport),
                'nextActionDueDate': fmt_date(BASE_DATE + timedelta(days=random.randint(1, 10))),
                'lastActivity': last_activity,
                'createdAt': created_date,
                'updatedAt': last_activity,
                'dueDate': fmt_date(BASE_DATE + timedelta(days=random.randint(14, 60))),
                'orderId': None,
                'closeProbability': prob,
            }
            opportunities.append(opp)

        # ── Create Activities ─────────────────────────────────────────────
        # Prospecting activities
        all_orgs_for_rep = [o for o in organizations if o['assignedRep'] == rep_name]
        prospecting_count = config['prospecting_activities']
        follow_up_count = config['follow_up_activities']

        # Mix of activity types based on org coverage
        for i in range(prospecting_count):
            org = random.choice(all_orgs_for_rep)
            school_name = org['name']

            # Pick a lane and sport
            lane = random.choice(LANES)
            sport = random.choice(SPORTS)

            # Determine message type based on org status
            if org['coverageStatus'] == 'UNTOUCHED':
                msg = activity_message('ORG', school_name, 'prospecting', lane, sport, rep_name)
            elif org['coverageStatus'] == 'CONTACTED':
                msg = random.choice([
                    activity_message('ORG', school_name, 'discovery', lane, sport, rep_name),
                    activity_message('ORG', school_name, 'follow_up', lane, sport, rep_name),
                ])
            else:
                msg = random.choice([
                    activity_message('ORG', school_name, 'production', lane, sport, rep_name),
                    activity_message('ORG', school_name, 'follow_up', lane, sport, rep_name),
                    activity_message('ORG', school_name, 'closed', lane, sport, rep_name),
                ])

            date = fmt_date(random_date(1, 60))

            # Determine entity type and id
            entity_type = 'ORGANIZATION'
            entity_id = org['id']
            # Sometimes reference an opportunity
            rep_opps = [o for o in opportunities if o['organizationId'] == org['id'] and o['assignedRep'] == rep_name]
            if rep_opps and random.random() < 0.3:
                opp = random.choice(rep_opps)
                entity_type = 'OPPORTUNITY'
                entity_id = opp['id']

            act = {
                'id': generate_id('act', act_counter),
                'entityType': entity_type,
                'entityId': entity_id,
                'message': msg,
                'timestamp': f'{date}T{random.randint(8, 18):02d}:{random.randint(0, 59):02d}:00Z',
                'user': rep_name,
            }
            act_counter += 1
            activities.append(act)

        # Follow-up activities
        for i in range(follow_up_count):
            org = random.choice(all_orgs_for_rep)
            school_name = org['name']
            lane = random.choice(LANES)
            sport = random.choice(SPORTS)
            msg = activity_message('ORG', school_name, 'follow_up', lane, sport, rep_name)
            date = fmt_date(random_date(0, 45))

            entity_type = 'ORGANIZATION'
            entity_id = org['id']
            rep_opps = [o for o in opportunities if o['organizationId'] == org['id'] and o['assignedRep'] == rep_name]
            if rep_opps and random.random() < 0.4:
                opp = random.choice(rep_opps)
                entity_type = 'OPPORTUNITY'
                entity_id = opp['id']

            act = {
                'id': generate_id('act', act_counter),
                'entityType': entity_type,
                'entityId': entity_id,
                'message': msg,
                'timestamp': f'{date}T{random.randint(8, 18):02d}:{random.randint(0, 59):02d}:00Z',
                'user': rep_name,
            }
            act_counter += 1
            activities.append(act)

        # Director activities (Primeau's reviews)
        if config.get('is_director'):
            for i in range(15):
                org = random.choice(all_orgs_for_rep)
                rep_opps = [o for o in opportunities if o['organizationId'] == org['id']]
                if not rep_opps:
                    continue
                opp = random.choice(rep_opps)
                msg = activity_message('ORG', org['name'], 'director', opp['lanes'][0] if opp.get('lanes') else 'UNIFORM', opp.get('sport', 'Football'), org['assignedRep'])
                date = fmt_date(random_date(0, 50))
                act = {
                    'id': generate_id('act', act_counter),
                    'entityType': 'OPPORTUNITY',
                    'entityId': opp['id'],
                    'message': msg,
                    'timestamp': f'{date}T{random.randint(8, 18):02d}:{random.randint(0, 59):02d}:00Z',
                    'user': 'Primeau Hill (Director)',
                }
                act_counter += 1
                activities.append(act)

    # ── Add 4 closed-lost opportunities ──────────────────────────────────
    all_created_orgs = {o['name']: o for o in organizations}
    # Pick 4 schools that had opps but lost
    active_opp_schools = [o['organizationName'] for o in opportunities if o['stage'] not in ('CLOSED_WON', 'CLOSED_LOST')]
    candidates_for_lost = [s for s in active_opp_schools if s in all_created_orgs]
    random.shuffle(candidates_for_lost)

    for school_name in candidates_for_lost[:4]:
        org = all_created_orgs[school_name]
        lane = random.choice(['UNIFORM', 'TEAM_STORE'])
        sport = random.choice(['Football', 'Basketball', 'Hockey'])
        value = random.choice([6500, 8200, 9500, 11000])
        created_date = fmt_date(random_date(20, 60))
        closed_date = fmt_date(random_date(10, 30))

        opp_id = generate_id('opp', opp_counter)
        opp_counter += 1

        opp = {
            'id': opp_id,
            'title': f'{school_name} - {sport} {lane.replace("_", " ").title()}',
            'organizationId': org['id'],
            'organizationName': school_name,
            'lanes': [lane],
            'sport': sport,
            'season': pick_season(sport),
            'stage': 'CLOSED_LOST',
            'value': value,
            'assignedRep': org['assignedRep'],
            'assignedDirector': 'Primeau Hill',
            'estimatedValue': value,
            'nextAction': 'Re-engage in 90 days with revised pricing',
            'nextActionDueDate': fmt_date(BASE_DATE + timedelta(days=90)),
            'lastActivity': closed_date,
            'createdAt': created_date,
            'updatedAt': closed_date,
            'dueDate': closed_date,
            'orderId': None,
            'closeProbability': 0,
        }
        opportunities.append(opp)

        # Lost activity
        act = {
            'id': generate_id('act', act_counter),
            'entityType': 'OPPORTUNITY',
            'entityId': opp_id,
            'message': f'Deal lost – {school_name} went with {random.choice(["Nike", "Under Armour", "Adidas"])} on pricing for {sport} {lane.replace("_", " ").title()}',
            'timestamp': f'{closed_date}T14:30:00Z',
            'user': opp['assignedRep'],
        }
        act_counter += 1
        activities.append(act)

    # ── Sort activities by timestamp descending ──────────────────────────
    activities.sort(key=lambda a: a['timestamp'], reverse=True)

    # ── Build reports summary ────────────────────────────────────────────
    total_pipeline = sum(o['value'] for o in opportunities if o['stage'] not in ('CLOSED_WON', 'CLOSED_LOST'))
    total_closed_won = sum(o['value'] for o in opportunities if o['stage'] == 'CLOSED_WON')
    total_closed_lost = len([o for o in opportunities if o['stage'] == 'CLOSED_LOST'])

    # Lane performance
    lane_perf = []
    for lane in LANES:
        lane_opps = [o for o in opportunities if lane in o.get('lanes', [])]
        lane_won = sum(o['value'] for o in lane_opps if o['stage'] == 'CLOSED_WON')
        lane_pipeline = sum(o['value'] for o in lane_opps if o['stage'] not in ('CLOSED_WON', 'CLOSED_LOST'))
        lane_closed = len([o for o in lane_opps if o['stage'] == 'CLOSED_WON'])
        lane_total = len([o for o in lane_opps if o['stage'] in ('CLOSED_WON', 'CLOSED_LOST')])
        lane_perf.append({
            'lane': lane,
            'pipeline': lane_pipeline,
            'won': lane_won,
            'winRate': round(lane_closed / max(1, lane_total) * 100),
        })

    # Rep performance
    rep_perf = []
    for rep_name, config in REP_CONFIG.items():
        rep_opps = [o for o in opportunities if o['assignedRep'] == rep_name]
        rep_won = [o for o in rep_opps if o['stage'] == 'CLOSED_WON']
        rep_active = [o for o in rep_opps if o['stage'] not in ('CLOSED_WON', 'CLOSED_LOST')]
        rep_lost = [o for o in rep_opps if o['stage'] == 'CLOSED_LOST']
        rep_orgs = [o for o in organizations if o['assignedRep'] == rep_name]
        rep_orders = [o for o in orders if o['assignedRep'] == rep_name]
        rep_activities = [a for a in activities if rep_name in a['user']]

        rep_perf.append({
            'rep': rep_name,
            'pin': config['pin'],
            'territory': config['zone'],
            'totalSchools': config['total_schools'],
            'organizationsCreated': len(rep_orgs),
            'territoryCoverage': round(len(rep_orgs) / config['total_schools'] * 100),
            'activeOpportunities': len(rep_active),
            'closedWon': len(rep_won),
            'closedLost': len(rep_lost),
            'totalRevenue': sum(o['value'] for o in rep_won),
            'pipelineValue': sum(o['value'] for o in rep_active),
            'activities': len(rep_activities),
            'performance': config['performance'],
            'productMix': config['product_mix'],
        })

    # Ops workspace queue
    ops_queue = {
        'NEEDS_REVIEW': [],
        'READY_FOR_VENDOR': [],
        'IN_PRODUCTION': [],
        'BLOCKED': [],
        'COMPLETED': [],
    }
    for o in orders:
        status = o['productionStatus']
        if status in ops_queue:
            ops_queue[status].append(o)

    reports_summary = {
        'weeklySummary': {
            'pipelineAdded': sum(o['value'] for o in opportunities if o.get('createdAt', '') >= fmt_date(BASE_DATE - timedelta(days=7))),
            'closedWon': sum(o['value'] for o in opportunities if o['stage'] == 'CLOSED_WON' and o.get('updatedAt', '') >= fmt_date(BASE_DATE - timedelta(days=7))),
            'newOrganizations': sum(1 for o in organizations if o.get('lastActivity', '') >= fmt_date(BASE_DATE - timedelta(days=7))),
            'blockedOrders': len([o for o in orders if o['productionStatus'] == 'BLOCKED']),
        },
        'monthlySummary': {
            'pipelineTotal': total_pipeline,
            'closedWon': total_closed_won,
            'winRate': round(len([o for o in opportunities if o['stage'] == 'CLOSED_WON']) / max(1, len([o for o in opportunities if o['stage'] in ('CLOSED_WON', 'CLOSED_LOST')])) * 100),
            'averageDeal': round(total_closed_won / max(1, len([o for o in opportunities if o['stage'] == 'CLOSED_WON']))),
        },
        'lanePerformance': lane_perf,
        'repPerformance': rep_perf,
    }

    # ── Generate TypeScript ──────────────────────────────────────────────

    def ts_value(val):
        if val is None:
            return 'null'
        if isinstance(val, bool):
            return 'true' if val else 'false'
        if isinstance(val, (int, float)):
            if isinstance(val, float):
                return str(round(val, 2))
            return str(val)
        if isinstance(val, str):
            escaped = val.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
            return f"'{escaped}'"
        if isinstance(val, list):
            items = ', '.join(ts_value(v) for v in val)
            return f'[{items}]'
        if isinstance(val, dict):
            pairs = ', '.join(f'{ts_value(k)}: {ts_value(v)}' for k, v in val.items())
            return f'{{{pairs}}}'
        return str(val)

    def ts_object(obj, indent=2):
        """Format a dict as TypeScript object literal."""
        prefix = ' ' * indent
        lines = []
        for key, value in obj.items():
            k = key if key.isidentifier() and key[0].islower() else f"'{key}'"
            lines.append(f'{prefix}{k}: {ts_value(value)}')
        return '{\n' + ',\n'.join(lines) + f'\n{" " * (indent - 2)}}}'

    def ts_array(arr, indent=2, name=None):
        prefix = ' ' * indent
        items = []
        for item in arr:
            items.append(ts_object(item, indent + 2))
        body = ',\n'.join(items)
        return f'[\n{body}\n{" " * (indent - 2)}]'

    # TypeScript output
    ts = '''import { REVENUE_LANES as revenueLanes } from '../config/business';
export type RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN';
export type LaneStatus = 'OPEN' | 'ACTIVE' | 'WON' | 'LOST';
export type OpportunityStage =
  | 'LEAD_ENGAGED'
  | 'DISCOVERY'
  | 'MOCKUP_STAGE'
  | 'INVOICE_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'LEAD_ASSIGNED'
  | 'CONTACTED'
  | 'MOCKUP_REQUESTED'
  | 'MOCKUP_DELIVERED'
  | 'DECISION_PENDING'
  | 'PAYMENT_RECEIVED';

export type CoverageStatus = 'UNTOUCHED' | 'CONTACTED' | 'ACTIVE' | 'CLOSED';
export type TerritoryId = 'metro' | 'north' | 'west' | 'south';

export type TeamMember = {
  id: string;
  name: string;
  role: 'OWNER' | 'DIRECTOR' | 'REP' | 'OPS';
  territoryIds: TerritoryId[];
  active: boolean;
};

export type Organization = {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedDirector: string;
  territory: TerritoryId;
  schoolPhone?: string;
  athleticDirectorName?: string;
  athleticDirectorEmail?: string;
  athleticDirectorPhone?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
  coverageStatus: CoverageStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  pipelineValue: number;
  status: 'ACTIVE' | 'WATCH' | 'NEW';
  nextAction: string;
  lastActivity: string;
  leadTier?: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNASSIGNED';
  laneStatuses: Record<RevenueLane, { status: LaneStatus; estimatedValue: number; activeOpportunityCount: number; nextAction: string }>;
  expansionRecommendation: string;
};

export type Opportunity = {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  lanes: RevenueLane[];
  sport: string;
  season: string;
  stage: OpportunityStage;
  value: number;
  assignedRep: string;
  assignedDirector?: string;
  estimatedValue?: number;
  nextAction: string;
  nextActionDueDate?: string;
  lastActivity: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  orderId?: string | null;
  closeProbability: number;
};

export type Order = {
  id: string;
  organizationId: string;
  organizationName: string;
  opportunityId: string;
  lane: RevenueLane;
  value: number;
  productionStatus: 'NEEDS_REVIEW' | 'READY_FOR_VENDOR' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED';
  orderStage?: 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
  previousActiveStage?: 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
  title?: string;
  sport?: string;
  quantity?: number;
  dueDate?: string;
  assignedRep?: string;
  assignedDirector?: string;
  nextAction?: string;
  nextActionOwner?: string;
  paymentStatus?: string;
  artworkStatus?: string;
  vendorStatus?: string;
  shippingStatus?: string;
  customerContact?: string;
  resolutionDueDate?: string;
  completedDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  riskStatus?: 'red' | 'yellow' | 'green' | 'gray';
  activityIds?: string[];
  missingInfo: string[];
  vendor: string;
  createdDate: string;
  vendorNotes: string;
};

export type Activity = {
  id: string;
  entityType: 'ORGANIZATION' | 'OPPORTUNITY' | 'ORDER';
  entityId: string;
  message: string;
  timestamp: string;
  user: string;
};

export const opportunityStages: OpportunityStage[] = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON', 'CLOSED_LOST'];

export const teamMembers: TeamMember[] = [
  { id: 'u-owner-coach-bradshaw', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-director-primeau-hill', name: 'Primeau Hill', role: 'DIRECTOR', territoryIds: ['metro', 'south', 'west', 'north'], active: true },
  { id: 'u-rep-josh-hoffman', name: 'Josh Hoffman', role: 'REP', territoryIds: ['metro'], active: true },
  { id: 'u-rep-josh-hoffman', name: 'Josh Hoffman', role: 'REP', territoryIds: ['metro'], active: true },
  { id: 'u-rep-david-lundberg', name: 'David Lundberg', role: 'REP', territoryIds: ['south'], active: true },
  { id: 'u-rep-david-lundberg', name: 'David Lundberg', role: 'REP', territoryIds: ['west', 'north'], active: true },
];

'''

    ts += f'\nexport const organizations: Organization[] = {ts_array(organizations, indent=0)};\n'

    ts += f'\nexport const opportunities: Opportunity[] = {ts_array(opportunities, indent=0)};\n'

    ts += f'\nexport const orders: Order[] = {ts_array(orders, indent=0)};\n'

    ts += f'\nexport const activities: Activity[] = {ts_array(activities, indent=0)};\n'

    ts += f'''
export const reportsSummary = {ts_object(reports_summary, indent=0)};

export const opsWorkspaceQueue = {{
  NEEDS_REVIEW: orders.filter(o => o.productionStatus === 'NEEDS_REVIEW'),
  READY_FOR_VENDOR: orders.filter(o => o.productionStatus === 'READY_FOR_VENDOR'),
  IN_PRODUCTION: orders.filter(o => o.productionStatus === 'IN_PRODUCTION'),
  BLOCKED: orders.filter(o => o.productionStatus === 'BLOCKED'),
  COMPLETED: orders.filter(o => o.productionStatus === 'COMPLETED'),
}};
'''

    # Write to file
    output_path = 'apps/web/src/data/mockSalesData.ts'
    with open(output_path, 'w') as f:
        f.write(ts)

    print(f'\n✅ Generated data written to {output_path}')
    print(f'   Organizations: {len(organizations)}')
    print(f'   Opportunities: {len(opportunities)} ({len([o for o in opportunities if o["stage"] == "CLOSED_WON"])} closed-won, {len([o for o in opportunities if o["stage"] == "CLOSED_LOST"])} closed-lost)')
    print(f'   Orders: {len(orders)}')
    print(f'   Activities: {len(activities)}')
    print(f'   File size: {len(ts):,} chars')


if __name__ == '__main__':
    main()
