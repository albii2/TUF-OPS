# TUF Ops User Guide

Welcome to the TUF Ops application. This guide provides an overview of the key features and how to use them.

## 1. Logging In

To access the application, you will need to log in with the credentials provided to you. The application uses a secure, credentials-based authentication system.

**Team Credentials:**

-   **Admin Role (You):**
    -   **Email:** `albii2@tufops.com`
    -   **Password:** `TUFops!2026`
-   **Director Role:**
    -   **Email:** `jason.wolf@tufops.com`
    -   **Password:** `Wolf!2026`
-   **Director Role:**
    -   **Email:** `primeau.hill@tufops.com`
    -   **Password:** `Hill!2026`

## 2. Dashboard

The Dashboard is the first screen you will see after logging in. It provides a high-level overview of the sales pipeline and key performance indicators (KPIs).

-   **Pipeline Stages:** A bar chart visualizing the number of opportunities in each stage of the sales process.
-   **Total Revenue:** A summary of revenue from all paid invoices.
-   **Director-Level Insights (Director Role Only):** Additional metrics, such as gross margin and total costs, are visible only to users with the 'director' or 'admin' role.

## 3. Organizations

The Organizations section allows you to manage the schools, clubs, and other entities you work with.

-   **View Organizations:** The main page displays a paginated list of all organizations in the system.
-   **Create an Organization:**
    1.  Click the "Create Organization" button.
    2.  Fill in the "Organization Name" (required) and "Zoho Account ID" (optional).
    3.  Click "Create Organization" to save the new entity.

## 4. Opportunities

The Opportunities section is where you manage potential sales deals.

-   **Create an Opportunity:**
    1.  Navigate to the "Opportunities" section from the main menu.
    2.  Click the "Create Opportunity" button.
    3.  Fill out the form:
        -   **Opportunity Name:** A descriptive name for the deal (e.g., "Northwood Football Uniforms 2024").
        -   **Organization:** Select the associated organization from the dropdown list.
        -   **Stage:** Select the current stage of the opportunity from the dropdown.
        -   **Estimated Value:** The potential monetary value of the deal.
        -   **Probability:** The likelihood of closing the deal, as a percentage.
    4.  Click "Create Opportunity" to save.

## 5. Settings

The Settings page allows you to manage your user account.

-   **Update Your Name:** You can update your full name by entering a new name in the input field and clicking "Save Settings".

## 6. Connecting to Live CRM Data

Currently, the application is running with a local, seeded test database. The functionality to connect to a live Zoho CRM is planned for a future development phase. The steps will involve:

1.  **Environment Configuration:** Setting secure environment variables for the Zoho CRM API keys and endpoint URLs.
2.  **API Service Layer:** Building a dedicated service within the application to handle all communication with the Zoho API.
3.  **Data Synchronization Logic:** Implementing logic to either fetch data from Zoho in real-time or to periodically sync Zoho data with the application's local database.
4.  **Refactoring API Routes:** Updating the application's API routes (e.g., `/api/organizations`) to call the Zoho API service layer instead of the local Prisma database client.

This process will be undertaken as a distinct and well-planned work package to ensure a seamless and secure integration.
