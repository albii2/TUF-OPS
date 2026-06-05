# TUF Ops Deployment Guide (Railway DB + Vercel Custom Domain)

## Prerequisites

1.  **GitHub Repository**: Your project code must be in a GitHub repository.
2.  **Vercel Account**: You will need a Vercel account (you can sign up for free).
3.  **Railway Postgres Project**: You need an active Railway Postgres instance.

## Step 1: Set Up Your Vercel Project

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  **Import** the GitHub repository containing your TUF Ops project.
4.  In the **Configure Project** screen, make the following adjustments:
    *   **Root Directory**: Set this to `apps/frontend`.
    *   **Build & Output Settings**: Vercel should automatically detect that this is a Next.js application. No changes are needed here.

## Step 2: Configure Environment Variables

Before deploying, you need to add the necessary environment variables to your Vercel project. In the project settings, navigate to the **Environment Variables** section and add the following:

| Name              | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`    | Your full Railway database connection string.                           |
| `NEXTAUTH_URL`    | The full URL of your production deployment (e.g., `https://tuf-ops.vercel.app`). |
| `NEXTAUTH_SECRET` | A new, securely generated secret key. You can generate one by running `openssl rand -base64 32` in your terminal. |

**IMPORTANT**: Once your custom domain is connected, set `NEXTAUTH_URL` to that custom domain URL (for example: `https://ops.tufsports.us`), not localhost.

## Step 3: Railway Database Setup

1. Create a Railway project and add a Postgres service.
2. Copy the generated **DATABASE_URL** from Railway Variables.
3. In Vercel Project Settings → Environment Variables, set:
   - `DATABASE_URL` (Production + Preview)
4. Run migrations against Railway from this repo:
   - `pnpm --filter frontend prisma migrate deploy`
5. Seed baseline auth users:
   - `pnpm --filter frontend prisma db seed`

## Step 4: Deploy

Once you have configured the project and added the environment variables, click the **Deploy** button.

Vercel will now build and deploy your application. After a few moments, your TUF Ops platform will be live and accessible at the URL provided by Vercel.

## Step 5: Configure Custom Domain in Vercel

1. Project Settings → **Domains** → add your domain (`ops.tufsports.us`).
2. Add DNS records exactly as Vercel instructs (typically CNAME/A record).
3. Wait for verification.
4. Update `NEXTAUTH_URL` to the final custom domain URL.

## Step 6: Production Verification Checklist

- `/auth/signin` loads on custom domain.
- User login succeeds.
- Organizations endpoint can read/write from Railway DB.
- Opportunities endpoint can read/write from Railway DB.
- No localhost URLs remain in runtime environment variables.
