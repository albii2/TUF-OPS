# TUF Ops Deployment Guide

This guide provides step-by-step instructions for deploying the TUF Ops application to a production environment using Vercel.

## Prerequisites

1.  **GitHub Repository**: Your project code must be in a GitHub repository.
2.  **Vercel Account**: You will need a Vercel account (you can sign up for free).

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

**IMPORTANT**: The `NEXTAUTH_URL` must be the final production URL that Vercel assigns to your deployment, not `http://localhost:3000`.

## Step 3: Deploy

Once you have configured the project and added the environment variables, click the **Deploy** button.

Vercel will now build and deploy your application. After a few moments, your TUF Ops platform will be live and accessible at the URL provided by Vercel.

## Step 4 (Optional): Custom Domain

In the Vercel project settings, you can navigate to the **Domains** section to add a custom domain (e.g., `ops.tuf-sports.com`).
