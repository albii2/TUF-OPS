# TUF Ops Environment Setup (v0.9)

This document lists the required environment variables for both the **Vercel Frontend** and the **Railway API Backend** across Preview and Production environments.

---

## 1. Vercel Frontend Environment Variables

Configure these variables in your Vercel Project Settings under **Environment Variables**.

### Preview Environment (Vercel)
Set these variables to target the Preview environment scope:
* **`VITE_APP_ENV`**: `preview`
* **`VITE_DATA_MODE`**: `api`
* **`VITE_API_BASE_URL`**: `<Your Railway Preview API base URL>` (e.g., `https://tuf-ops-api-preview.up.railway.app`)

### Production Environment (Vercel)
Set these variables to target the Production environment scope:
* **`VITE_APP_ENV`**: `production`
* **`VITE_DATA_MODE`**: `api`
* **`VITE_API_BASE_URL`**: `<Your Railway Production API base URL>` (e.g., `https://tuf-ops-api-production.up.railway.app`)

---

## 2. Railway API Backend Environment Variables

Configure these variables in your Railway Project under the **Variables** tab for the API service.

### Preview Environment (Railway)
* **`APP_ENV`**: `preview`
* **`PORT`**: `4000`
* **`DATABASE_URL`**: `<Your Railway Preview Postgres connection string>`
* **`AUTH_TOKEN_SECRET`**: `<A secure random string for signing JWT tokens>`
* **`CORS_ORIGINS`**: `<Your Vercel Preview URL(s), separated by commas>`

### Production Environment (Railway)
* **`APP_ENV`**: `production`
* **`PORT`**: `4000`
* **`DATABASE_URL`**: `<Your Railway Production Postgres connection string>`
* **`AUTH_TOKEN_SECRET`**: `<A secure random string for signing JWT tokens>`
* **`CORS_ORIGINS`**: `<Your Vercel Production URL(s), separated by commas>`
