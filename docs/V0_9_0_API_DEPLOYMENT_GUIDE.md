# TUF Ops API Deployment Guide (v0.9)

This guide provides beginner-friendly, step-by-step instructions for deploying and configuring the database-backed TUF Ops API and connecting it to the TUF Ops frontend.

---

## 1. Core Architecture: Frontend vs. Backend

### Why the Frontend Cannot Talk Directly to the Database
The TUF Ops frontend (built with React/Vite and hosted on Vercel) runs entirely inside the user's web browser. If we connected the frontend directly to PostgreSQL:
1. **Security Vulnerability:** Your database credentials (`DATABASE_URL` including username and password) would be visible to anyone inspecting the website's source code.
2. **Access Control:** The database would have to be open to public network access, exposing it to malicious attacks.
3. **Architecture Boundary:** Databases expect persistent, pool-based TCP connections, whereas browser apps use HTTP fetch requests.

### The Role of the API Backend
The backend API (`apps/api` built with Fastify) acts as a secure intermediary:
- **Server-Side Security:** It runs on a private, secure server environment where environment variables like `DATABASE_URL` and `JWT_SECRET` are kept hidden.
- **Access Control:** It validates user requests, inspects session tokens, and executes parameterized queries against the database without exposing raw credentials.

---

## 2. Where the API Backend Runs
The API backend must be deployed as a separate web service on **Railway**, which hosts both the API container and your PostgreSQL databases.

### Railway API Setup (Preview & Production)
For both **Preview** and **Production** environments on Railway, follow these steps to deploy `apps/api`:

1. **Create a New Service:**
   - Go to your project on Railway.
   - Click **+ New** -> **Github Repo** -> select the `TUF-OPS` repository.
2. **Configure Service Settings:**
   - Name the service `tuf-ops-api-preview` (for Preview) or `tuf-ops-api-production` (for Production).
   - Set the **Root Directory** to `apps/api` (or keep root and configure the start/build commands).
   - Under **Build** tab, set the Build Command to: `pnpm build`
   - Under **Deploy** tab, set the Start Command to: `node dist/index.js`
3. **Generate Public Domain:**
   - Under the service's **Settings** tab, scroll to **Networking**.
   - Click **Generate Domain** to get a public URL (e.g. `https://tuf-ops-api-production.up.railway.app`). This is your `VITE_API_BASE_URL`.

---

## 3. Required Environment Variables

### A. Railway API Service (Private Env)
Add the following variables under the **Variables** tab of the Railway API service:
- `PORT`: `4000` (Railway automatically binds this)
- `DATABASE_URL`: `postgresql://...` (Link to the corresponding Railway Postgres service)
- `AUTH_TOKEN_SECRET`: A secure random secret string used to sign JWT sessions.
- `APP_ENV`: `preview` or `production`
- `CORS_ORIGINS`: Your Vercel frontend URL(s) separated by commas (e.g. `https://tufops.vercel.app,http://localhost:5173`).

### B. Vercel Frontend Service (Browser Env)
Add these variables in your Vercel Project Settings -> **Environment Variables**:
- `VITE_APP_ENV`: `preview` or `production`
- `VITE_DATA_MODE`: `api` (instructs the web app to query the backend database instead of using local fallback data)
- `VITE_API_BASE_URL`: The public domain URL generated from your Railway API service (e.g., `https://tuf-ops-api-production.up.railway.app`).

---

## 4. Verification & Testing

Once both services are deployed, verify the setup:

1. **Verify Health Endpoint:**
   Open a browser or run curl to query the API health endpoint:
   ```bash
   curl https://<your-railway-api-domain>/health
   # Expected response: {"status":"ok","service":"tuf-ops-api","timestamp":"..."}
   ```
2. **Verify Training Routes:**
   Ensure the training module routes are responsive:
   ```bash
   curl https://<your-railway-api-domain>/training/modules?role=TAE
   # Expected response: A JSON array of seeded training modules for the TAE role.
   ```
