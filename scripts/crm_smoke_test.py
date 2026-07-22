"""
CRM Smoke Test — verify org + opportunity creation for every role.
Run: python3 scripts/crm_smoke_test.py
"""
import json, urllib.request, sys, time

BASE = 'https://ops.tufsports.us'
API = BASE + '/api/v1'
FAILURES = []

USERS = [
    {'label': 'ADMIN', 'pin': '8188', 'role': 'ADMIN'},
    {'label': 'DIRECTOR', 'pin': '7188', 'role': 'DIRECTOR'},
    {'label': 'REP', 'pin': '6350', 'role': 'REP'},
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
    auth = 'Bearer ' + d['token']
    return auth, d['user']

def test(label, pin, expected_role):
    ts = str(int(time.time()))
    org_name = 'SMOKE-' + label + '-' + ts
    opp_name = 'SMOKE-OPP-' + label + '-' + ts

    try:
        # 1. Login
        token, user = login(pin)
        assert user['role'] == expected_role
        print('  ok login ' + user['name'] + ' (' + user['role'] + ')')

        # 2. Create org
        s, org = api('POST', '/organizations', token=token, body={
            'name': org_name, 'city': 'SmokeTest', 'state': 'MN',
            'assignedRep': user['name'], 'assignedDirector': 'Primeau Hill',
            'territory': 'metro', 'priority': 'MEDIUM',
        })
        assert s == 201, 'Create org failed: ' + str(s) + ' ' + str(org)[:200]
        oid = org.get('id')
        assert oid, 'No org id: ' + str(org)
        rname = org.get('assigned_rep_name') or ''
        assert rname == user['name'], 'Name mismatch: ' + str(rname) + ' != ' + user['name']
        print('  ok org #' + str(oid) + ': ' + org_name)

        # 3. Verify org in list
        s, orgs = api('GET', '/organizations', token=token)
        assert s == 200
        found = [o for o in orgs if o.get('id') == oid]
        assert found, 'Org not in list'
        print('  ok org in list')

        # 4. Create opportunity
        s, opp = api('POST', '/opportunities', token=token, body={
            'organizationId': oid, 'name': opp_name,
            'sport': 'Football', 'lanes': ['UNIFORM'],
            'value': 1000, 'stage': 'LEAD_ENGAGED',
        })
        assert s == 201, 'Create opp failed: ' + str(s) + ' ' + str(opp)[:200]
        opid = opp.get('id')
        assert opid, 'No opp id: ' + str(opp)
        print('  ok opp #' + str(opid) + ': ' + opp_name)

        # 5. Verify opp in list
        s, opps = api('GET', '/opportunities', token=token)
        assert s == 200
        oplist = opps if isinstance(opps, list) else opps.get('opportunities', opps.get('items', []))
        found_opp = [o for o in oplist if o.get('id') == opid]
        assert found_opp, 'Opp not in list (' + str(len(oplist)) + ' total)'
        print('  ok opp in list')

        # 6. Cleanup (DELETE returns no body — handle gracefully)
        try:
            api('DELETE', '/organizations/' + str(oid), token=token)
            print('  ok cleanup')
        except Exception:
            print('  ok cleanup (no body)')

        return True
    except Exception as e:
        FAILURES.append(label + ': ' + str(e))
        print('  FAIL: ' + str(e))
        return False

if __name__ == '__main__':
    print('CRM Smoke Test')
    print('=' * 40)
    for u in USERS:
        print('\n' + u['label'] + ' (' + u['role'] + '):')
        test(u['label'], u['pin'], u['role'])

    print('\n' + '=' * 40)
    if FAILURES:
        print('FAIL ' + str(len(FAILURES)) + ' error(s):')
        for f in FAILURES:
            print('  ' + f)
        sys.exit(1)
    else:
        print('PASS — all roles can create orgs + opps')
