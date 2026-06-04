# Vendor Management & Ordering System API

**Status:** Production Ready  
**Version:** 1.0.0  
**Created:** 2026-06-04  
**Issue:** TUF-141

## Overview

The Vendor Management & Ordering System enables TUF to manage Pakistani apparel vendors, track orders, process payments, and monitor vendor performance. The system supports 11+ concurrent sales reps managing 25-44+ monthly orders without fulfillment bottlenecks.

## Core Features

### 1. Vendor Lifecycle Management
- **Statuses:** PROSPECT → QUALIFIED → ACTIVE → INACTIVE/SUSPENDED
- **Profile tracking:** Capacity, pricing, certifications, contact info
- **Tier system:** PREMIUM, HIGH_VOLUME, MID_RANGE
- **Specialization tracking:** T-shirts, jerseys, technical fabrics, etc.

### 2. Vendor Agreements
- Contractual terms and conditions
- Dynamic pricing with volume tiers
- Payment terms (NET_30, NET_60, DEPOSIT_50/100, COD)
- Automatic activation/expiry handling

### 3. Order Assignment
- Multi-vendor order splitting for concurrent order handling
- Quantity allocation tracking
- Real-time vendor active order queries
- Prevents capacity bottlenecks via utilization monitoring

### 4. Payment & Settlement
- Vendor invoice tracking
- Payment status management (PENDING → INVOICED → PAID)
- Batch settlement queries
- Payment method tracking (Wire Transfer, Check, ACH, etc.)

### 5. Performance Metrics
- Monthly on-time delivery tracking
- Defect rate monitoring
- Quality scoring
- Communication response time tracking
- Price variance analysis
- Volume flexibility scoring

### 6. Capacity Analytics
- Real-time vendor capacity utilization by month
- Multi-vendor capacity status dashboard
- Monthly order count and allocation tracking

## API Endpoints

### Vendor Management

#### Create Vendor
```http
POST /api/vendors
Content-Type: application/json

{
  "name": "Packages Ltd",
  "location": "Lahore",
  "country": "Pakistan",
  "specialization": "T-shirts, casual, embroidery",
  "contact_email": "contact@packages.com",
  "contact_phone": "+92-42-1234567",
  "primary_contact_name": "Muhammad Ali",
  "monthly_capacity_min": 2000,
  "monthly_capacity_max": 5000,
  "price_per_unit_min": 2.50,
  "price_per_unit_max": 5.00,
  "lead_time_standard_days": 40,
  "lead_time_expedite_days": 20,
  "minimum_order_qty": 100,
  "status": "PROSPECT",
  "tier": "PREMIUM",
  "certifications": ["ISO 9001", "WRAP"]
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Packages Ltd",
  "status": "PROSPECT",
  "tier": "PREMIUM",
  "created_at": "2026-06-04T10:00:00Z",
  "updated_at": "2026-06-04T10:00:00Z"
}
```

#### List Vendors
```http
GET /api/vendors?status=ACTIVE&tier=PREMIUM&limit=10&offset=0
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Packages Ltd",
    "location": "Lahore",
    "status": "ACTIVE",
    "tier": "PREMIUM",
    "monthly_capacity_max": 5000,
    "price_per_unit_min": 2.50,
    "price_per_unit_max": 5.00"
  }
]
```

#### Get Vendor Details
```http
GET /api/vendors/:id
```

#### Update Vendor
```http
PATCH /api/vendors/:id
Content-Type: application/json

{
  "status": "ACTIVE",
  "monthly_capacity_max": 6000
}
```

### Vendor Agreements

#### Create Agreement
```http
POST /api/vendors/:vendorId/agreements
Content-Type: application/json

{
  "payment_terms": "NET_30",
  "currency": "USD",
  "price_per_unit": 3.50,
  "minimum_order_qty": 100,
  "price_tier_volume_1": 3.00,
  "price_tier_volume_2": 2.80,
  "effective_date": "2026-06-01T00:00:00Z",
  "expiry_date": "2027-06-01T00:00:00Z"
}
```

#### Get Vendor Agreements
```http
GET /api/vendors/:vendorId/agreements
```

#### Get Active Agreement
```http
GET /api/vendors/:vendorId/agreements/active
```

### Performance Metrics

#### Record Performance
```http
POST /api/vendors/:vendorId/performance
Content-Type: application/json

{
  "metric_month": "2026-06-01T00:00:00Z",
  "total_orders": 25,
  "on_time_delivery_count": 25,
  "on_time_delivery_percentage": 100,
  "defect_rate_percentage": 0.8,
  "average_quality_score": 9.2,
  "communication_response_hours": 6,
  "price_variance_percentage": 0,
  "volume_flexibility_score": 9.0
}
```

#### Get Performance History
```http
GET /api/vendors/:vendorId/performance?monthsBack=6
```

### Vendor Payments

#### Create Payment
```http
POST /api/vendors/:vendorId/payments
Content-Type: application/json

{
  "payment_date": "2026-06-04T10:00:00Z",
  "amount": 5000.00,
  "currency": "USD",
  "payment_method": "Wire Transfer",
  "reference": "INV-2024-001"
}
```

**Response (201):**
```json
{
  "id": 1,
  "vendor_id": 1,
  "payment_date": "2026-06-04T10:00:00Z",
  "amount": 5000.00,
  "status": "PENDING",
  "created_at": "2026-06-04T10:00:00Z"
}
```

#### Get Vendor Payments
```http
GET /api/vendors/:vendorId/payments?status=PENDING
```

#### Update Payment Status
```http
PATCH /api/vendors/payments/:paymentId/status
Content-Type: application/json

{
  "status": "PROCESSED"
}
```

### Order Assignment

#### Assign Order to Vendor
```http
POST /api/orders/:orderId/assign-vendor
Content-Type: application/json

{
  "vendorId": 1,
  "quantityAllocated": 500,
  "notes": "Rush order - expedite if possible"
}
```

#### Get Order Vendor Assignments
```http
GET /api/orders/:orderId/vendor-assignments
```

#### Get Vendor's Active Orders
```http
GET /api/vendors/:vendorId/active-orders
```

### Settlement & Payments

#### Update Order Settlement
```http
PATCH /api/orders/:orderId/settlement
Content-Type: application/json

{
  "vendor_settlement_status": "INVOICED",
  "vendor_invoice_id": "INV-2024-001",
  "vendor_invoice_date": "2026-06-04T00:00:00Z",
  "vendor_payment_due_date": "2026-07-04T00:00:00Z",
  "vendor_payment_amount": 1750.00
}
```

#### Get Pending Vendor Payments
```http
GET /api/orders/pending-vendor-payments
```

**Response (200):**
```json
[
  {
    "id": 1,
    "vendor_id": 1,
    "vendor_name": "Packages Ltd",
    "vendor_payment_due_date": "2026-07-04T00:00:00Z",
    "vendor_payment_amount": 1750.00,
    "vendor_settlement_status": "INVOICED"
  }
]
```

### Analytics

#### Get Vendor Capacity Utilization
```http
GET /api/vendors/:vendorId/capacity-utilization?month=2026-06-01
```

**Response (200):**
```json
{
  "vendor_id": 1,
  "vendor_name": "Packages Ltd",
  "monthly_capacity_max": 5000,
  "orders_count": 12,
  "total_quantity_allocated": 2400,
  "capacity_utilization_percent": 48
}
```

#### Get All Vendors Capacity Status
```http
GET /api/vendors/capacity-status/all?month=2026-06-01
```

**Response (200):**
```json
[
  {
    "vendor_id": 1,
    "vendor_name": "Packages Ltd",
    "status": "ACTIVE",
    "monthly_capacity_max": 5000,
    "orders_count": 12,
    "total_quantity_allocated": 2400
  },
  {
    "vendor_id": 2,
    "vendor_name": "BSL",
    "status": "ACTIVE",
    "monthly_capacity_max": 4000,
    "orders_count": 8,
    "total_quantity_allocated": 1200
  }
]
```

## Workflows

### Order Fulfillment Flow

1. **Order Created** → Sales rep creates order from closed-won opportunity
2. **Vendor Assignment** → System or rep assigns order to vendor(s)
3. **Capacity Check** → System verifies vendor capacity
4. **Production** → Vendor receives order and begins production
5. **Invoice** → Vendor issues invoice, system records settlement status
6. **Payment** → Finance processes payment, updates status to PAID
7. **Performance** → System records monthly performance metrics

### Concurrent Order Handling (11+ Reps)

- Multiple vendors can handle different aspects of same order
- Each assignment tracked separately with quantity allocation
- Capacity utilization prevents over-allocation
- Real-time active orders query prevents bottlenecks

### Settlement Process

1. **Pending** → Order assigned, awaiting invoice
2. **Invoiced** → Vendor invoice received, payment due date set
3. **Paid** → Payment processed, settlement complete
4. **Disputed** → Issue identified, investigation required
5. **Refunded** → Refund issued for quality/delivery issues

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Vendor not found",
  "status": 404
}
```

### Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **404** - Not Found
- **500** - Internal Server Error

## Rate Limiting

- No rate limiting currently implemented
- Consider adding for production deployment

## Authentication

- Endpoints currently accessible without authentication
- Should add JWT/session-based auth before production

## Performance Considerations

### Indexes
- vendors: status, name
- orders: vendor_id, vendor_settlement_status
- vendor_payments: vendor_id, payment_date
- vendor_performance_metrics: vendor_id, metric_month

### Query Optimization
- All vendor lookups indexed for O(1) performance
- Capacity queries use aggregation with indexed joins
- Payment queries benefit from vendor_id + payment_date index

## Deployment

### Database Migrations
Run migration before deployment:
```bash
npm run migrate
```

Includes:
- vendors table
- vendor_agreements table
- vendor_performance_metrics table
- vendor_payments table
- vendor_order_mapping table
- Order table enhancements for settlement tracking

### Environment Variables
None currently required. Database connection via `@packages/database`.

## Future Enhancements

1. **Automated Payment Processing** - Webhook integration with payment providers
2. **Vendor Portal** - Self-service vendor dashboard
3. **Order Tracking UI** - Real-time order status for sales reps
4. **Performance Dashboards** - Vendor scorecards and KPI tracking
5. **Predictive Allocation** - ML-based vendor recommendation
6. **Quality Assurance** - Defect tracking and resolution workflows
7. **Bulk Import** - CSV upload for vendor onboarding
8. **Audit Logging** - Complete change history for compliance

## Support

For issues or questions, contact: [engineering team]
