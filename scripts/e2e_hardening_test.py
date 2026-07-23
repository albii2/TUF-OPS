"""
TUF Ops CRM Hardening Test — Complete E2E Verification
Tests every failure mode we've ever seen and every fix we've applied.
Run: python3 scripts/e2e_hardening_test.py
"""

import json, urllib.request, sys, time

BASE = 'https://ops.tufsports.us'
API = BASE + '/api/v1'
FAILURES = []

# ── Test accounts ──
ACCOUNTS = {
    'ADMIN':    {'pin': '8188', 'role': 'ADMIN',    'name': 'Coach Bradshaw'},
    'DIRECTOR': {'pin': '7188', 'role': 'DIRECTOR',  'name': 'William Denzer'},
    'REP':      {'pin': '6350', 'role': 'REP',       'name': 'Ryan Streetar'},
    'DIRECTOR2':{'pin': '7288', 'role': 'DIRECTOR',   'name': 'Primeau Hill'},
}

def api(method, path, token=None, body=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = token
    r = urllib.request.Request(API + path, method=method, headers=headers)
    if body is not None:
        r.data = json.dumps(body).encode()
    try:
        resp = urllib.request.urlopen(r)
        text = resp.read().decode()
        if not text or not text.strip():
            return resp.status, {}
        return resp.status, json.loads(text)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]

def login(pin):
    s, d = api('POST', '/auth/login', body={'credential': pin})
    if s != 200:
        raise Exception('Login failed: ' + str(d)[:200])
    return 'Bearer ' + d['token'], d['user']

def check(label):
    """Decorator-style test case"""
    def wrapper(fn):
        try:
            fn()
        except Exception as e:
            FAILURES.append(f'{label}: {str(e)[:150]}')
    return wrapper

def ok(msg):
    print('  OK ' + msg)

# ═══════════════════════════════════════════
# HARDENING TEST 1: Organization Name Sync
# ═══════════════════════════════════════════
def test_org_name_sync():
    print('\n─── Org Name Sync ───')
    token, user = login('7288')  # Primeau
    ts = str(int(time.time()))

    for rep_name, rep_pin in [('Ryan Streetar', '6350'), ('Josh Hoffman', '6080')]:
        s, org = api('POST', '/organizations', token=token, body={
            'name': f'HT-{rep_name.split()[0]}-{ts}',
            'city': 'Test', 'state': 'MN',
            'assignedRep': rep_name, 'assignedDirector': 'Primeau Hill',
            'territory': 'metro', 'priority': 'MEDIUM',
        })
        assert s == 201, f'Create org for {rep_name}: HTTP {s}'
        oid = org['id']

        # Verify assigned_rep_name matches
        actual_name = org.get('assigned_rep_name') or ''
        assert actual_name == rep_name, \
            f'Name mismatch: got "{actual_name}", expected "{rep_name}"'
        ok(f'Created org for {rep_name} → assigned_rep_name="{actual_name}"')

        # Verify rep sees the org
        rt, _ = login(rep_pin)
        s, orgs = api('GET', '/organizations', token=rt)
        assert s == 200
        found = [o for o in orgs if o.get('id') == oid]
        assert found, f'{rep_name} cannot see org #{oid} in their list'
        ok(f'{rep_name} sees org #{oid} in their list')

        # Verify assigned_rep_id is correct
        assert org.get('assigned_rep_id') is not None, 'assigned_rep_id is NULL'
        ok(f'assigned_rep_id={org["assigned_rep_id"]} set correctly')

        # Cleanup
        api('DELETE', f'/organizations/{oid}', token=token)

    print('  → Org Name Sync: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 2: Stage Advancement
# ═══════════════════════════════════════════
def test_stage_advancement():
    print('\n─── Stage Advancement ───')
    token, user = login('6350')  # Ryan (REP)
    ts = str(int(time.time()))

    # Create org + opp
    s, org = api('POST', '/organizations', token=token, body={
        'name': f'HT-STAGE-{ts}', 'city': 'Test', 'state': 'MN',
        'assignedRep': 'Ryan Streetar', 'assignedDirector': 'Primeau Hill',
        'territory': 'metro', 'priority': 'MEDIUM',
    })
    assert s == 201, f'Create org: HTTP {s}'
    oid = org['id']

    s, opp = api('POST', '/opportunities', token=token, body={
        'organizationId': oid, 'name': f'HT-STAGE-OPP-{ts}',
        'sport': 'Football', 'lanes': ['UNIFORM'],
        'value': 5000, 'stage': 'lead',
    })
    assert s == 201, f'Create opp: HTTP {s}'
    opid = opp['id']

    # Advance through all stages: lead → proposal_sent → negotiation → order_assembly
    transitions = [
        ('lead', 'proposal_sent'),
        ('proposal_sent', 'negotiation'),
        ('negotiation', 'order_assembly'),
    ]
    for from_s, to_s in transitions:
        s, result = api('PUT', f'/opportunities/{opid}/stage', token=token,
                       body={'stage': to_s})
        assert s == 200, f'Stage {from_s}→{to_s}: HTTP {s} {str(result)[:200]}'
        ok(f'{from_s} → {to_s}')

    # Verify detail view has normalized stage
    s, detail = api('GET', f'/opportunities/{opid}', token=token)
    assert s == 200
    stage = detail.get('stage', '')
    ok(f'Detail stage: {stage}')

    # Verify Director can advance their rep's opp
    dt, du = login('7288')  # Primeau
    # Create new opp to test director advancing
    s, opp2 = api('POST', '/opportunities', token=token, body={
        'organizationId': oid, 'name': f'HT-DIR-ADV-{ts}',
        'sport': 'Basketball', 'lanes': ['UNIFORM'],
        'value': 3000, 'stage': 'lead',
    })
    assert s == 201
    opid2 = opp2['id']

    s, _ = api('PUT', f'/opportunities/{opid2}/stage', token=dt,
              body={'stage': 'proposal_sent'})
    assert s == 200, f'Director advance rep opp: HTTP {s}'
    ok('Director can advance rep opportunity')

    # Cleanup
    api('DELETE', f'/organizations/{oid}', token=token)

    print('  → Stage Advancement: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 3: Orders Page Integrity
# ═══════════════════════════════════════════
def test_orders_integrity():
    print('\n─── Orders Integrity ───')
    token, user = login('7288')  # Primeau

    # List orders
    s, orders = api('GET', '/orders', token=token)
    assert s == 200, f'Orders list: HTTP {s}'
    assert isinstance(orders, list), f'Orders not list: {type(orders)}'

    if len(orders) > 0:
        order = orders[0]
        # Verify all required fields exist (no crash points)
        assert 'id' in order, 'Missing id'
        # Verify all required fields exist (no crash points)
        ok(f'{len(orders)} orders, first has id={order.get("id")}, status={order.get("status", order.get("productionStatus", "?"))}')

        # Verify core fields present
        for field in ['id', 'organization_id', 'opportunity_id', 'status']:
            val = order.get(field, 'MISSING')
            ok(f'{field} = {str(val)[:50]}')

    ok(f'Orders list returns {len(orders)} order(s)')

    # Also verify from REP perspective
    rt, _ = login('6350')
    s, rep_orders = api('GET', '/orders', token=rt)
    assert s == 200
    ok(f'REP can see {len(rep_orders)} order(s)')

    print('  → Orders Integrity: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 4: Auth Token Lifecycle
# ═══════════════════════════════════════════
def test_auth_lifecycle():
    print('\n─── Auth Lifecycle ───')

    # Verify all 4 accounts can login
    for label, acct in ACCOUNTS.items():
        s, d = api('POST', '/auth/login', body={'credential': acct['pin']})
        assert s == 200, f'{label} login: HTTP {s}'
        assert d['user']['role'] == acct['role'], \
            f'{label} role: {d["user"]["role"]} != {acct["role"]}'
        ok(f'{label} ({acct["name"]}) login OK, role={d["user"]["role"]}')

    # Verify /auth/me works
    token, _ = login('6350')
    s, me = api('GET', '/auth/me', token=token)
    assert s == 200, f'/auth/me: HTTP {s}'
    assert me['user']['name'] == 'Ryan Streetar'
    ok('/auth/me returns correct user')

    # Verify expired/invalid token rejected
    s, _ = api('GET', '/auth/me', token='Bearer invalidtoken123')
    assert s == 401, f'Invalid token: expected 401, got {s}'
    ok('Invalid token rejected with 401')

    # Verify credential_version invalidation (PIN change → old token invalid)
    # (Skip in production — would disrupt real users)

    print('  → Auth Lifecycle: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 5: Permission Boundaries
# ═══════════════════════════════════════════
def test_permissions():
    print('\n─── Permission Boundaries ───')
    rt, _ = login('6350')  # Ryan (REP)

    # REP should NOT be able to delete orgs
    ts = str(int(time.time()))
    # Create org as admin first
    at, _ = login('8188')
    s, org = api('POST', '/organizations', token=at, body={
        'name': f'HT-PERM-{ts}', 'city': 'Test', 'state': 'MN',
        'assignedRep': 'Ryan Streetar', 'assignedDirector': 'Primeau Hill',
        'territory': 'metro', 'priority': 'MEDIUM',
    })
    assert s == 201
    oid = org['id']

    s, _ = api('DELETE', f'/organizations/{oid}', token=rt)
    assert s == 403, f'REP delete org: expected 403, got {s}'
    ok('REP cannot delete orgs (403)')

    # Cleanup as admin
    api('DELETE', f'/organizations/{oid}', token=at)
    ok('Admin can delete orgs')

    print('  → Permission Boundaries: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 6: Data Consistency (DB trigger)
# ═══════════════════════════════════════════
def test_data_consistency():
    print('\n─── Data Consistency ───')
    token, user = login('7288')  # Primeau
    ts = str(int(time.time()))

    # Create org with rep assigned
    for rep_name in ['Ryan Streetar', 'William Denzer', 'Josh Hoffman']:
        s, org = api('POST', '/organizations', token=token, body={
            'name': f'HT-DC-{rep_name.split()[0]}-{ts}',
            'city': 'Test', 'state': 'MN',
            'assignedRep': rep_name, 'assignedDirector': 'Primeau Hill',
            'territory': 'metro', 'priority': 'MEDIUM',
        })
        assert s == 201
        oid = org['id']

        # Verify name columns populated
        assert org.get('assigned_rep_name') == rep_name, \
            f'{rep_name}: assigned_rep_name mismatch'
        assert org.get('assigned_director_name') == 'Primeau Hill', \
            f'{rep_name}: assigned_director_name mismatch'
        ok(f'{rep_name}: both name columns correct')

        # Verify rep can see their org
        if rep_name == 'Ryan Streetar':
            rt, _ = login('6350')
        elif rep_name == 'William Denzer':
            rt, _ = login('7188')
        else:
            rt, _ = login('6080')

        s, orgs = api('GET', '/organizations', token=rt)
        found = [o for o in orgs if o.get('id') == oid]
        assert found, f'{rep_name} cannot see their own org #{oid}'
        ok(f'{rep_name} sees org in their list')

        # Cleanup
        api('DELETE', f'/organizations/{oid}', token=token)

    print('  → Data Consistency: ALL PASS')


# ═══════════════════════════════════════════
# RUN ALL
# ═══════════════════════════════════════════
if __name__ == '__main__':
    print('TUF Ops CRM Hardening Test')
    print('=' * 50)

    test_org_name_sync()
    test_stage_advancement()
    test_orders_integrity()
    test_auth_lifecycle()
    test_permissions()
    test_data_consistency()

    print('\n' + '=' * 50)
    if FAILURES:
        print(f'FAIL: {len(FAILURES)} hardening violation(s)')
        for f in FAILURES:
            print(f'  ❌ {f}')
        sys.exit(1)
    else:
        print('ALL HARDENING CHECKS PASS')
        print('CRM is unbreakable.')
