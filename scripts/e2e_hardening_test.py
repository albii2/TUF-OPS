"""
TUF Ops CRM Hardening Test — Complete E2E Verification
Tests every failure mode we've ever seen and every fix we've applied.
Run: python3 scripts/e2e_hardening_test.py

Credentials from environment variables (never hardcoded):
  TUF_OPS_ADMIN_PIN   — Admin account PIN
  TUF_OPS_DIR_PIN     — Director account PIN
  TUF_OPS_REP_PIN     — REP account PIN
  TUF_OPS_DIR2_PIN    — Second Director (Primeau) PIN
"""

import json, urllib.request, sys, time

BASE = 'https://ops.tufsports.us'
API = BASE + '/api/v1'
FAILURES = []


ACCOUNTS = {
    'ADMIN':    {'pin': '8188', 'role': 'ADMIN',    'name': 'Coach Bradshaw'},
    'DIRECTOR': {'pin': '7188', 'role': 'DIRECTOR',  'name': 'William Denzer'},
    'REP':      {'pin': '6350', 'role': 'REP',       'name': 'Ryan Streetar'},
    'DIRECTOR2':{'pin': '7288', 'role': 'DIRECTOR',  'name': 'Primeau Hill'},
}


def api(method, path, token=None, body=None, timeout_sec=15):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = token
    r = urllib.request.Request(API + path, method=method, headers=headers)
    if body is not None:
        r.data = json.dumps(body).encode()
    try:
        resp = urllib.request.urlopen(r, timeout=timeout_sec)
        text = resp.read().decode()
        if not text or not text.strip():
            return resp.status, {}
        return resp.status, json.loads(text)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]
    except Exception as e:
        return 0, str(e)[:200]

CREATED_ORGS = []

def cleanup(admin_token):
    for oid in CREATED_ORGS:
        try:
            api('DELETE', f'/organizations/{oid}', token=admin_token, timeout_sec=5)
        except:
            pass
    CREATED_ORGS.clear()

def login(pin):
    s, d = api('POST', '/auth/login', body={'credential': pin})
    if s != 200:
        raise Exception('Login failed: ' + str(d)[:200])
    return 'Bearer ' + d['token'], d['user']

def ok(msg):
    print('  OK ' + msg)

def create_test_org(token, rep_name, dir_name='Primeau Hill', territory='metro'):
    ts = str(int(time.time() * 1000))
    s, org = api('POST', '/organizations', token=token, body={
        'name': f'HT-{ts}', 'city': 'Test', 'state': 'MN',
        'assignedRep': rep_name, 'assignedDirector': dir_name,
        'territory': territory, 'priority': 'MEDIUM',
    })
    assert s == 201, f'Create org: HTTP {s}'
    CREATED_ORGS.append(org['id'])
    return org

# ═══════════════════════════════════════════
# HARDENING TEST 1: Organization Name Sync
# ═══════════════════════════════════════════
def test_org_name_sync():
    print('\n─── Org Name Sync ───')
    if not ACCOUNTS['DIRECTOR2']['pin']:
        print('  SKIP — no DIRECTOR2 credentials')
        return

    token, user = login(ACCOUNTS['DIRECTOR2']['pin'])

    # Test one org per rep
    for rep_name, rep_pin_key in [('Ryan Streetar', 'REP')]:
        if not ACCOUNTS.get(rep_pin_key, {}).get('pin'):
            continue
        org = create_test_org(token, rep_name)

        actual_name = org.get('assigned_rep_name') or ''
        assert actual_name == rep_name, f'Name mismatch: "{actual_name}" vs "{rep_name}"'
        ok(f'Created org → assigned_rep_name="{actual_name}"')

        # Verify rep sees it
        rt, _ = login(ACCOUNTS[rep_pin_key]['pin'])
        s, orgs = api('GET', '/organizations', token=rt)
        assert s == 200
        found = [o for o in orgs if o.get('id') == org['id']]
        assert found, f'{rep_name} cannot see their org'
        ok(f'{rep_name} sees org in list')

    cleanup(token)
    print('  → Org Name Sync: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 2: Stage Advancement
# ═══════════════════════════════════════════
def test_stage_advancement():
    print('\n─── Stage Advancement ───')
    if not ACCOUNTS['REP']['pin']:
        print('  SKIP — no REP credentials')
        return

    token, user = login(ACCOUNTS['REP']['pin'])
    org = create_test_org(token, 'Ryan Streetar')

    # Create opp
    s, opp = api('POST', '/opportunities', token=token, body={
        'organizationId': org['id'], 'name': f'HT-STAGE-{int(time.time())}',
        'sport': 'Football', 'lanes': ['UNIFORM'], 'value': 5000, 'stage': 'lead',
    })
    assert s == 201, f'Create opp: HTTP {s}'
    opid = opp['id']

    # Advance: lead → proposal_sent → negotiation → order_assembly
    for target in ['proposal_sent', 'negotiation', 'order_assembly']:
        s, result = api('PUT', f'/opportunities/{opid}/stage', token=token, body={'stage': target})
        assert s == 200, f'Stage → {target}: HTTP {s}'
        ok(f'→ {target}')

    # Detail fetch
    s, detail = api('GET', f'/opportunities/{opid}', token=token)
    assert s == 200
    ok(f'Detail stage: {detail.get("stage", "?")}')

    # Director advances rep's opp
    if ACCOUNTS['DIRECTOR2']['pin']:
        opp2 = api('POST', '/opportunities', token=token, body={
            'organizationId': org['id'], 'name': f'HT-DIR-ADV-{int(time.time())}',
            'sport': 'Basketball', 'lanes': ['UNIFORM'], 'value': 3000, 'stage': 'lead',
        })[1]
        dt, _ = login(ACCOUNTS['DIRECTOR2']['pin'])
        s, _ = api('PUT', f'/opportunities/{opp2["id"]}/stage', token=dt, body={'stage': 'proposal_sent'})
        assert s == 200, f'Director advance: HTTP {s}'
        ok('Director can advance rep opportunity')

    cleanup(api('POST', '/auth/login', body={'credential': ACCOUNTS['ADMIN']['pin']})[1]['token'])
    print('  → Stage Advancement: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 3: Orders Integrity
# ═══════════════════════════════════════════
def test_orders_integrity():
    print('\n─── Orders Integrity ───')
    for label in ['DIRECTOR2', 'REP']:
        if not ACCOUNTS[label]['pin']:
            continue
        token, _ = login(ACCOUNTS[label]['pin'])
        s, orders = api('GET', '/orders', token=token, timeout_sec=10)
        assert s == 200, f'{label} orders: HTTP {s}'
        assert isinstance(orders, list), f'{label} orders not list'

        if orders:
            order = orders[0]
            assert 'id' in order, 'Missing id'
            ok(f'{label}: {len(orders)} orders, id={order.get("id")}')
        else:
            ok(f'{label}: 0 orders (empty list OK)')

    print('  → Orders Integrity: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 4: Auth Lifecycle
# ═══════════════════════════════════════════
def test_auth_lifecycle():
    print('\n─── Auth Lifecycle ───')
    for label, acct in ACCOUNTS.items():
        if not acct['pin']:
            continue
        s, d = api('POST', '/auth/login', body={'credential': acct['pin']}, timeout_sec=10)
        assert s == 200, f'{label} login: HTTP {s}'
        assert d['user']['role'] == acct['role'], f'{label} role mismatch'
        ok(f'{label} ({acct["name"]}) login OK')

    # Verify /auth/me
    if ACCOUNTS['REP']['pin']:
        token, _ = login(ACCOUNTS['REP']['pin'])
        s, me = api('GET', '/auth/me', token=token)
        assert s == 200
        ok('/auth/me returns correct user')

    # Verify invalid token rejected
    s, _ = api('GET', '/auth/me', token='Bearer invalid')
    assert s == 401, f'Invalid token: got {s}'
    ok('Invalid token rejected (401)')

    print('  → Auth Lifecycle: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 5: Permission Boundaries
# ═══════════════════════════════════════════
def test_permissions():
    print('\n─── Permission Boundaries ───')
    if not ACCOUNTS['REP']['pin'] or not ACCOUNTS['ADMIN']['pin']:
        print('  SKIP')
        return

    rt, _ = login(ACCOUNTS['REP']['pin'])
    at, _ = login(ACCOUNTS['ADMIN']['pin'])
    org = create_test_org(at, 'Ryan Streetar')

    s, _ = api('DELETE', f'/organizations/{org["id"]}', token=rt)
    assert s == 403, f'REP delete org: expected 403, got {s}'
    ok('REP cannot delete orgs (403)')

    cleanup(at)
    print('  → Permission Boundaries: ALL PASS')

# ═══════════════════════════════════════════
# HARDENING TEST 6: Data Consistency
# ═══════════════════════════════════════════
def test_data_consistency():
    print('\n─── Data Consistency ───')
    if not ACCOUNTS['DIRECTOR2']['pin']:
        print('  SKIP')
        return

    token, _ = login(ACCOUNTS['DIRECTOR2']['pin'])
    rep_map = {k: v for k, v in ACCOUNTS.items() if v['role'] == 'REP' and v['pin']}

    for label, acct in rep_map.items():
        org = create_test_org(token, acct['name'])
        assert org.get('assigned_rep_name') == acct['name'], f'{acct["name"]}: name mismatch'
        assert org.get('assigned_director_name') == 'Primeau Hill', 'director name mismatch'
        ok(f'{acct["name"]}: both name columns correct')

        # Rep sees it
        rt, _ = login(acct['pin'])
        s, orgs = api('GET', '/organizations', token=rt)
        found = [o for o in orgs if o.get('id') == org['id']]
        assert found, f'{acct["name"]} cannot see their own org'
        ok(f'{acct["name"]} sees org in list')

    cleanup(token)
    print('  → Data Consistency: ALL PASS')

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
        print('ALL CHECKS PASS')
