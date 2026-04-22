# TUF Ops: The Rebuild Blueprint

**Date:** 2026-03-18
**Status:** In Progress

## 1. Mandate

Following a series of critical, unrecoverable failures in the Python-based backend, a full reset has been ordered. The previous implementation is considered a toxic asset. This document outlines the architecture and phased plan for the rebuild.

Our mandate is to simplify the implementation layer so the TUF Ops business system can finally run correctly and scale with velocity.

## 2. Preserved Assets (The Product Thinking)

We will not discard the hard-won business logic. The following assets are preserved and will be migrated to the new architecture:

*   **Data Models:** All table structures and relationships as defined in `db/schema.sql`.
*   **Business Workflows:** The logic for sales stages, mockups, samples, orders, and invoices.
*   **Role Definitions:** The Admin, Director, Sales Rep, and Ops roles and their intended permissions.
*   **UI Architecture:** The existing Next.js frontend structure will be the foundation of the new unified application.
*   **TUF Ops Business Requirements:** All feature specifications, including the Victory Pipeline, Territory Intelligence, and Financial Command Center.

## 3. The V1 Technology Stack

*   **Application Framework:** Next.js (App Router)
*   **API Layer:** Next.js Route Handlers & Server Actions
*   **Database:** PostgreSQL on Railway
*   **ORM:** Prisma
*   **Authentication:** NextAuth.js (Auth.js)
*   **File Storage:** S3-Compatible Storage (for mockups, rosters, etc.)
*   **Email:** Resend

## 4. The Rebuild Phasing

We will rebuild in a disciplined, sequential order. No phase begins until the previous one is complete and validated.

*   **Phase 1: Core System Spine**
    1.  Auth (Users & Roles)
    2.  Organizations
    3.  Opportunities
    4.  Notes/Activity Log

*   **Phase 2: Revenue-Critical Workflows**
    1.  Mockups
    2.  Samples
    3.  Invoices & Payment Links
    4.  Opportunity Stage Transitions

*   **Phase 3: Order Execution**
    1.  Uniform Orders
    2.  Roster Uploads & Parsing
    3.  Order Items

*   **Phase 4: Intelligence & Command**
    1.  Territory Intelligence Tables
    2.  Dashboard Metrics
    3.  Territory Command Screen

## 5. Architectural Principle: Business Actions, Not CRUD

The new API will be built around business actions (e.g., `approveMockup()`, `sendInvoice()`) rather than generic CRUD endpoints (`updateOpportunity()`). This will ensure the system remains aligned with real-world TUF Ops workflows.
