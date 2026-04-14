# TUF Ops

TUF Ops is an internal application designed to streamline and manage core business operations for The Uniform Factory, including sales, customer relationship management, and order processing.

## Current Scope (v0.2.4 baseline)

This is the current stabilized baseline version of the application. The manually verified scope includes the following core features:

- **Authentication:** Users can sign in with an email and password.
- **Dashboard:** A basic application shell/layout after login.
- **Organizations:** Users can create, view a list of, and view the details of customer organizations.
- **Opportunities:** Users can create new sales opportunities and associate them with an existing organization.

The core dependency between creating an Organization and it being available when creating an Opportunity is functional.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **UI:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)

## Local Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as the package manager.
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and fill in your local details.
    ```bash
    cp .env.example .env
    ```
    You will need to provide your own `NEXTAUTH_SECRET` and a `DATABASE_URL` for a local PostgreSQL instance.

4.  **Set up the database:**
    Apply database migrations and seed the database with an initial admin user.
    ```bash
    pnpm prisma migrate dev
    pnpm prisma db seed
    ```
    The default admin credentials are `admin@tufops.com` / `admin123`.

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

## Intentionally Deferred

This baseline intentionally defers several features that were part of earlier, unstable development efforts. The focus was to stabilize the core MVP flow. The following are **not** included in this baseline:

- **E2E Testing:** All Playwright tests have been removed to establish a clean, working baseline.
- **Invoices:** All code related to invoice creation and management has been removed.
- **Territory Maps:** This feature is not included.
- **Advanced Reporting & Analytics:** Not included in the current scope.
