# TUF Ops Manual Testing Script

This script is designed to be executed by a non-technical user to verify the core functionality of the TUF Ops platform. Please follow the steps carefully and note any deviations from the expected results.

## Prerequisites

- The application must be running in a development environment.
- The database must be seeded with the initial data.

## 1. Authentication

### 1.1. Login

1.  Navigate to the application URL (e.g., `http://localhost:3000`).
2.  You should be redirected to the sign-in page.
3.  Enter the following credentials:
    -   **Email:** `admin@tufops.com`
    -   **Password:** `admin123`
4.  Click the "Sign in" button.

**Expected Result:** You should be redirected to the dashboard page.

### 1.2. Logout

1.  From the dashboard, click on the user avatar in the top right corner of the screen.
2.  Click the "Sign out" button.

**Expected Result:** You should be redirected to the sign-in page.

## 2. Dashboard

### 2.1. Dashboard Widgets

1.  Log in to the application.
2.  Verify that the following widgets are displayed on the dashboard:
    -   "Today's Focus"
    -   "Pipeline Snapshot"
    -   "Deals Near Close"
    -   "Owner Leaderboard"

**Expected Result:** All widgets should be displayed with data.

## 3. Organizations

### 3.1. View Organizations

1.  From the dashboard, click on the "Organizations" link in the left-hand navigation menu.

**Expected Result:** You should be taken to the organizations page, where a table of organizations is displayed.

### 3.2. Create Organization

1.  From the organizations page, click the "New Organization" button.
2.  Fill in the form with the following details:
    -   **Organization Name:** "Test Organization"
    -   **Owner:** Select any user from the dropdown.
3.  Click the "Save" button.

**Expected Result:** The new organization should be created and displayed in the table.

### 3.3. Edit Organization

1.  From the organizations page, click the "Edit" button next to the "Test Organization" you just created.
2.  Change the name of the organization to "Test Organization (Edited)".
3.  Click the "Save" button.

**Expected Result:** The organization's name should be updated in the table.

## 4. Opportunities

### 4.1. View Opportunities

1.  From the dashboard, click on the "Opportunities" link in the left-hand navigation menu.

**Expected Result:** You should be taken to the opportunities page, where a table of opportunities is displayed.

### 4.2. Create Opportunity

1.  From the opportunities page, click the "New Opportunity" button.
2.  Fill in the form with the following details:
    -   **Opportunity Name:** "Test Opportunity"
    -   **Organization:** Select an organization from the dropdown.
    -   **Owner:** Select any user from the dropdown.
3.  Click the "Save" button.

**Expected Result:** The new opportunity should be created and displayed in the table.

### 4.3. Edit Opportunity

1.  From the opportunities page, click the "Edit" button next to the "Test Opportunity" you just created.
2.  Change the name of the opportunity to "Test Opportunity (Edited)".
3.  Click the "Save" button.

**Expected Result:** The opportunity's name should be updated in the table.

## 5. Leads

### 5.1. View Leads

1.  From the dashboard, click on the "Leads" link in the left-hand navigation menu.

**Expected Result:** You should be taken to the leads page, where a table of leads is displayed.

### 5.2. Create Lead

1.  From the leads page, click the "New Lead" button.
2.  Fill in the form with the following details:
    -   **Organization Name:** "Test Lead"
    -   **Contact Name:** "Test Contact"
3.  Click the "Save" button.

**Expected Result:** The new lead should be created and displayed in the table.

### 5.3. Convert Lead

1.  From the leads page, click the "Convert" button next to the "Test Lead" you just created.

**Expected Result:** The lead should be converted to an opportunity, and you should be redirected to the new opportunity's page.

## 6. Orders

### 6.1. View Orders

1.  From the dashboard, click on the "Orders" link in the left-hand navigation menu.

**Expected Result:** You should be taken to the orders page, where a table of orders is displayed.

### 6.2. View Order Details

1.  From the orders page, click on an order to view its details.

**Expected Result:** You should be taken to the order details page, where you can see the order's status, associated opportunity, and other information.
