#!/usr/bin/env python3
import requests, json

BASE = "https://ops.tufsports.us/api/v1"

# Login
print("=== LOGIN ===")
r = requests.post(BASE + "/auth/login", json={"credential": "6350"})
print("Status:", r.status_code)
data = r.json()
tok = data["token"]
user = data["user"]
print("User:", user["name"], "id=" + str(user["id"]), "role=" + str(user["role"]), "certified=" + str(user["is_certified"]))
print("Token length:", len(tok))

hdrs = {"Authorization": "Bearer " + tok}

def do(method, path, body=None):
    url = BASE + path
    if method == "GET":
        r = requests.get(url, headers=hdrs)
    elif method == "PUT":
        r = requests.put(url, headers=hdrs, json=body)
    elif method == "POST":
        r = requests.post(url, headers=hdrs, json=body)
    ct = r.headers.get("content-type","")
    if ct.startswith("application/json"):
        return r.status_code, r.json()
    return r.status_code, r.text[:200]

# A: order_assembly -> closed_won
print("\n=== A: order_assembly -> closed_won (valid) ===")
code, body = do("PUT", "/opportunities/1327/stage", {"stage": "closed_won"})
print("Status:", code)
if isinstance(body, dict):
    print("stage:", body.get("stage"))
    print("name:", body.get("name"))
else:
    print("Response:", body)

# B: closed_won -> ready_for_operations (TAE blocked)
print("\n=== B: closed_won -> ready_for_operations (TAE beyond CW) ===")
code, body = do("PUT", "/opportunities/1327/stage", {"stage": "ready_for_operations"})
print("Status:", code)
if isinstance(body, dict):
    print(json.dumps(body, indent=2))
else:
    print(body)

# Check opp 1328
print("\n=== CHECK opp 1328 ===")
code, body = do("GET", "/opportunities/1328")
print("Status:", code)
if isinstance(body, dict):
    print("stage:", body.get("stage"), "name:", body.get("name"))

# C: INVOICE_SENT as stage name
print("\n=== C: INVOICE_SENT stage name ===")
code, body = do("PUT", "/opportunities/1328/stage", {"stage": "INVOICE_SENT"})
print("Status:", code)
if isinstance(body, dict):
    print("stage:", body.get("stage"), "or message:", body.get("message"))
else:
    print(body)

# D: Invalid stage
print("\n=== D: BOGUS_STAGE ===")
code, body = do("PUT", "/opportunities/1323/stage", {"stage": "BOGUS_STAGE"})
print("Status:", code)
if isinstance(body, dict):
    print("message:", body.get("message", body))
else:
    print(body)

# E: GET /orders HTML
print("\n=== E: GET /orders (HTML page) ===")
r = requests.get("https://ops.tufsports.us/orders")
print("Status:", r.status_code)
print("Content-Type:", r.headers.get("content-type",""))
print("Is SPA HTML:", "<!doctype html>" in r.text[:200].lower())

# F: GET /api/v1/orders
print("\n=== F: GET /api/v1/orders ===")
code, body = do("GET", "/orders")
print("Status:", code)
if isinstance(body, list):
    print("Count:", len(body))
    for o in body:
        print("  Order id=" + str(o.get("id")) + " status=" + str(o.get("status")) + " opp_id=" + str(o.get("opportunity_id")))

# G: Without auth
print("\n=== G: GET /api/v1/opportunities without auth ===")
r = requests.get(BASE + "/opportunities?limit=1")
print("Status:", r.status_code)
print("Response:", r.text[:300])

print("\n=== DONE ===")
