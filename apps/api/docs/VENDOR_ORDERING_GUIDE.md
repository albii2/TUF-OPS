# Vendor Ordering System - Sales Rep Guide

**For:** Sales Representatives & Order Managers  
**Issue:** TUF-141  
**Last Updated:** 2026-06-04

## Quick Start

### Step 1: Create an Order
Once your opportunity is marked **CLOSED_WON**, the system automatically creates an order.

**What happens:**
- Order status: `CREATED`
- Ready for vendor assignment
- Order links to the customer opportunity

### Step 2: Assign Vendor(s)
Assign your order to one or more Pakistani vendors based on their specialization and capacity.

**Example:** 
- 1,000 unit order → 500 to Packages Ltd (t-shirts), 500 to BSL (performance wear)

**Check Available Vendors:**
```
GET /api/vendors?status=ACTIVE
```

See each vendor's:
- Monthly capacity
- Specialization
- Lead time
- Pricing

**Assign to Vendor:**
```
POST /api/orders/{orderId}/assign-vendor
{
  "vendorId": 1,           // Packages Ltd
  "quantityAllocated": 500, // units
  "notes": "Standard production"
}
```

### Step 3: Track Vendor Capacity
Before assigning, check vendor utilization for the month.

**Check Capacity:**
```
GET /api/vendors/{vendorId}/capacity-utilization
```

**Sample Response:**
```json
{
  "vendor_name": "Packages Ltd",
  "monthly_capacity_max": 5000,
  "orders_count": 12,
  "total_quantity_allocated": 2400,
  "available_capacity": 2600  // 5000 - 2400
}
```

If capacity is tight, consider:
- Multi-vendor assignment (split the order)
- Expedited lead time (costs more, faster delivery)
- Choosing alternative vendor (check specialization match)

### Step 4: Monitor Order Status
Track production, transit, and delivery.

**Get Active Orders for Vendor:**
```
GET /api/vendors/{vendorId}/active-orders
```

**Status Flow:**
1. `CREATED` → Order placed with vendor
2. `IN_PRODUCTION` → Vendor manufacturing
3. `IN_TRANSIT` → Order shipped to customer
4. `DELIVERED` → Received by customer
5. `COMPLETED` → Fully fulfilled and settled

### Step 5: Handle Payment & Settlement
Vendor invoices and payments are managed by Finance, but sales reps should track status.

**Update Settlement Status (Finance):**
```
PATCH /api/orders/{orderId}/settlement
{
  "vendor_settlement_status": "INVOICED",
  "vendor_invoice_id": "INV-2024-001",
  "vendor_payment_due_date": "2026-07-04T00:00:00Z",
  "vendor_payment_amount": 1750.00
}
```

**Settlement Status Explained:**
- `PENDING` → Awaiting vendor invoice
- `INVOICED` → Invoice received, payment processing
- `PAID` → Payment sent to vendor, order complete
- `DISPUTED` → Issue with invoice/delivery, under review
- `REFUNDED` → Refund issued (quality/delivery issues)

## Vendor Directory

### Overview
```
GET /api/vendors?status=ACTIVE
```

**Key Vendors:**

| Vendor | Location | Specialization | Capacity | Tier | Lead Time |
|--------|----------|-----------------|----------|------|-----------|
| **Packages Ltd** | Lahore | T-shirts, casual, embroidery | 2,000-5,000/mo | Premium | 40 days std / 20 expedite |
| **BSL** | Lahore | Performance wear, technical fabrics | 1,500-4,000/mo | Premium | 35 days std / 18 expedite |
| **Farida Textiles** | Faisalabad | Basic cotton, high-volume | 3,000-10,000/mo | High-Vol | 45 days std / 25 expedite |
| **A&M Garments** | Karachi | Sports wear, custom branding | 1,500-4,000/mo | Mid-range | 40 days std / 20 expedite |
| **Mustafa Textiles** | Multan | Jersey/knit, athletic wear | 1,200-4,500/mo | Mid-range | 42 days std / 22 expedite |

### When to Use Which Vendor

**High-volume, cost-conscious orders:**
→ Farida Textiles (20-30% cheaper, scales to 10,000+/month)

**Quality/brand-sensitive, technical fabrics:**
→ BSL (OEKO-TEX certified, quality focus)

**Custom embroidery, rushed timelines:**
→ Packages Ltd (premium pricing, fastest expedite)

**Geographic advantage (reduce shipping):**
→ A&M Garments (Karachi port, faster transit to US)

**Athletic/knit specialization:**
→ Mustafa Textiles (jersey expertise)

## Common Workflows

### Workflow 1: Simple Single-Vendor Order (500 units)
```
1. Opportunity CLOSED_WON → Order CREATED
2. GET /api/vendors?status=ACTIVE (find best fit)
3. Check capacity: GET /api/vendors/1/capacity-utilization
4. Assign: POST /api/orders/123/assign-vendor { vendorId: 1, quantityAllocated: 500 }
5. Order status: IN_PRODUCTION
6. Track: GET /api/vendors/1/active-orders
7. Finance updates: PATCH /api/orders/123/settlement { status: INVOICED, ... }
8. Status: PAID → Order complete
```

### Workflow 2: Multi-Vendor Split (1,000 units)
**Scenario:** 1,000 units, split by specialization
- 600 performance wear → BSL
- 400 casual t-shirts → Packages Ltd

```
1. Order CREATED (1,000 units)
2. POST /api/orders/124/assign-vendor { vendorId: 2, quantityAllocated: 600 }
3. POST /api/orders/124/assign-vendor { vendorId: 1, quantityAllocated: 400 }
4. GET /api/orders/124/vendor-assignments (verify both assigned)
5. Track both vendors separately: GET /api/vendors/{1,2}/active-orders
6. Finance settles with each vendor individually
```

### Workflow 3: Capacity Constraint (2,000 units, high demand month)
**Scenario:** All vendors near capacity; can't assign 2,000 units to one vendor

```
1. Check all capacity: GET /api/vendors/capacity-status/all?month=2026-06
2. Vendors available:
   - BSL: 1,200 units available
   - Mustafa: 800 units available
   - Farida: 1,500 units available (high-volume buffer)
3. Split order:
   - 1,200 → BSL (performance wear specialization match)
   - 800 → Mustafa (knit specialization match)
   - 0 → Farida (cost higher, other vendors suitable)
4. Result: All capacity allocated, no bottleneck
```

## Troubleshooting

### Issue: Vendor at 95% capacity
**Solution:**
1. Check other vendors with similar specialization
2. Consider expedited lead time (costs more, uses less concurrent time)
3. Split order across 2 vendors
4. Discuss with Ops if extending timeline is acceptable

### Issue: Vendor payment overdue (30+ days)
**Solution:**
1. Contact Finance team
2. Check vendor settlement status: pending? disputed?
3. If payment already processed, request vendor follow-up
4. Escalate if vendor threatens production delay

### Issue: Multi-vendor order, one vendor delayed
**Solution:**
1. Contact delayed vendor to confirm new ETA
2. If unacceptable, consider re-routing remaining units to alternate vendor
3. Proactively update customer on revised delivery date
4. Log delay in vendor performance metric for monthly review

## Key Metrics (Monthly Review)

**Your role in monitoring:**
- **On-time delivery:** % of orders delivered by promised date
- **Defect rate:** % of units with quality issues
- **Quality score:** 1-10 rating per order (you assign)
- **Communication:** Response time from vendor (hours to reply)
- **Price consistency:** Month-to-month pricing variance

**How it's used:**
- Performance scores inform future vendor prioritization
- Low performers get escalated to management
- Consistent performers earn priority for rush orders
- Data guides vendor renewal negotiations

**Access vendor scorecard:**
```
GET /api/vendors/{vendorId}/performance?monthsBack=6
```

## Payment & Finance

**As sales rep, you:**
- ✓ Track settlement status in order
- ✓ Flag discrepancies to Finance
- ✗ Do NOT process actual payments (Finance handles)
- ✗ Do NOT negotiate vendor terms (Ops handles)

**Finance will:**
- Receive vendor invoice
- Update order settlement status to INVOICED
- Process payment
- Update status to PAID
- Resolve disputes

**If Finance marks order as DISPUTED:**
- Reach out to understand issue
- May involve customer complaint or vendor quality issue
- Work with ops to resolve (refund, replacement, etc.)

## Performance Standards

**Vendor expectations:**
- On-time delivery: ≥98%
- Defect rate: <2%
- Communication: <24 hour response time
- Price variance: <2% month-to-month
- Volume flexibility: ±20% on short notice

**If vendor consistently misses targets:**
1. Escalate to Operations
2. May result in reduced allocation
3. Consider alternate vendor onboarding
4. Potential vendor suspension or termination

## Quick Reference: Common API Calls

**List active vendors:**
```
GET /api/vendors?status=ACTIVE
```

**Check vendor capacity for this month:**
```
GET /api/vendors/{vendorId}/capacity-utilization?month=2026-06-01
```

**Assign order to vendor:**
```
POST /api/orders/{orderId}/assign-vendor
{ "vendorId": 1, "quantityAllocated": 500, "notes": "..." }
```

**See vendor's current orders:**
```
GET /api/vendors/{vendorId}/active-orders
```

**Check settlement status:**
```
GET /api/orders/{orderId}
```
Look for: `vendor_settlement_status`, `vendor_payment_due_date`, `vendor_paid_date`

**View vendor performance (6 months):**
```
GET /api/vendors/{vendorId}/performance?monthsBack=6
```

## Support

**Questions about vendors?** → Ask Operations  
**Payment issue?** → Ask Finance  
**API/system issue?** → File tech support ticket  

---

**Remember:** By efficiently using multiple vendors and balancing their capacity, we prevent the order fulfillment bottleneck that would happen if we relied on a single vendor. Smart assignment = scalability!
