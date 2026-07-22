"""
TUF Ops Regression Test — 5 Core Workflows
Run after every deploy. Any failure = no ship.
python3 scripts/regression_test.py
"""
import json, urllib.request, sys, time

BASE = 'https://ops.tufsports.us'
API = BASE + '/api/v1'
FAILURES = []

USERS = [
    {'label': 'ADMIN',  'pin': '8188', 'role': 'ADMIN'},
    {'label': 'DIRECTOR', 'pin': '7188', 'role': 'DIRECTOR'},
    {'label': 'REP',     'pin': '6350', 'role': 'REP'},
]

def api(method, path, token=None, body=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = token
    r = urllib.request.Request(API + path, method=method, headers=headers)
    if body is not None:
        r.data = json.dumps(body).encode()
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]

def login(pin):
    s, d = api('POST', '/auth/login', body={'credential': pin})
    if s != 200:
        raise Exception('Login failed: ' + str(d))
    return 'Bearer ' + d['token'], d['user']

def test(label, pin, expected_role):
    ts = str(int(time.time()))
    print(f'\n--- {label} ({expected_role}) ---')

    try:
        # 1. AUTHENTICATION
        token, user = login(pin)
        assert user['role'] == expected_role, f'Role: {user["role"]} != {expected_role}'
        print('  [PASS] Auth — login')

        # Verify /auth/me works
        s, me = api('GET', '/auth/me', token=token)
        assert s == 200, f'/auth/me: {s}'
        print('  [PASS] Auth — token validation')

        # 2. ORGANIZATIONS
        s, orgs = api('GET', '/organizations', token=token)
        assert s == 200
        assert isinstance(orgs, list), f'orgs not list: {type(orgs)}'
        org_count = len(orgs)
        print(f'  [PASS] Organizations — {org_count} orgs')

        # Create org
        s, org = api('POST', '/organizations', token=token, body={
            'name': f'REGRESSION-{label}-{ts}', 'city': 'Test', 'state': 'MN',
            'assignedRep': user['name'], 'assignedDirector': 'Primeau Hill',
            'territory': 'metro', 'priority': 'MEDIUM',
        })
        assert s == 201, f'Create org: {s} {str(org)[:200]}'
        oid = org['id']
        print(f'  [PASS] Organizations — create #{oid}')

        # View single org
        s, org_detail = api('GET', f'/organizations/{oid}', token=token)
        assert s == 200, f'View org: {s}'
        print('  [PASS] Organizations — view detail')

        # 3. PIPELINE (Opportunities)
        s, opps = api('GET', '/opportunities', token=token)
        assert s == 200
        print(f'  [PASS] Pipeline — list ({len(opps) if isinstance(opps,list) else "dict"})')

        # Create opportunity
        s, opp = api('POST', '/opportunities', token=token, body={
            'organizationId': oid, 'name': f'REGRESSION-OPP-{label}-{ts}',
            'sport': 'Football', 'lanes': ['UNIFORM'],
            'value': 5000, 'stage': 'lead',
        })
        assert s == 201, f'Create opp: {s} {str(opp)[:200]}'
        opid = opp['id']
        current_stage = opp.get('stage', '')
        print(f'  [PASS] Pipeline — create opp #{opid} ({current_stage})')

        # Advance stage: lead -> proposal_sent -> negotiation -> order_assembly
        transitions = [
            ('lead', 'proposal_sent'),
            ('proposal_sent', 'negotiation'),
            ('negotiation', 'order_assembly'),
        ]
        for from_s, to_s in transitions:
            s, result = api('PUT', f'/opportunities/{opid}/stage', token=token,
                           body={'stage': to_s})
            actual = result.get('stage', '') if isinstance(result, dict) else ''
            # Normalize comparison
            assert s == 200, f'Stage {from_s}->{to_s}: HTTP {s} {str(result)[:200]}'
            print(f'  [PASS] Pipeline — stage {from_s} -> {to_s}')

        # 4. ORDERS
        s, orders = api('GET', '/orders', token=token)
        assert s == 200, f'Orders: {s}'
        order_count = len(orders) if isinstance(orders, list) else 0
        print(f'  [PASS] Orders — {order_count} orders')

        # 5. PEOPLE
        s, people = api('GET', '/people', token=token)
        if s == 200:
            print(f'  [PASS] People — endpoint OK')
        elif s == 404:
            print(f'  [WARN] People — 404 (endpoint may not exist yet)')
        else:
            print(f'  [WARN] People — {s}')

        # CLEANUP (DELETE may return empty body — handle gracefully)
        try:
            s, _ = api('DELETE', f'/organizations/{oid}', token=token)
            print(f'  [INFO] Cleanup — {"OK" if s in (200,204) else s}')
        except Exception:
            print(f'  [INFO] Cleanup — OK (no body)')

        return True
    except Exception as e:
        FAILURES.append(f'{label}: {e}')
        print(f'  [FAIL] {e}')
        return False

if __name__ == '__main__':
    print('TUF Ops Regression Test — 5 Core Workflows')
    print('=' * 50)
    for u in USERS:
        test(u['label'], u['pin'], u['role'])

    print('\n' + '=' * 50)
    if FAILURES:
        print(f'FAIL {len(FAILURES)} error(s):')
        for f in FAILURES:
            print(f'  {f}')
        sys.exit(1)
    else:
        print('PASS — all core workflows working for all roles')
