# Step by step: Vercel (frontend) + Render (API) + PostgreSQL

This project uses **.NET 8 + EF Core + Npgsql (PostgreSQL)**. **SQL Server is no longer used** in the code; local dev and cloud both target Postgres.

**What you get**

- **Vercel**: static React (Vite) app, global CDN, good for the UI.
- **Render**: runs the **.NET API** in Docker; can run a **free PostgreSQL** in the same account.
- **One URL to submit** for the UI: your **Vercel** domain (it calls the API on Render via `VITE_API_URL`).

**Accounts (free tier)**

- [GitHub](https://github.com) — host the code (free).
- [Vercel](https://vercel.com) — hobby tier (free) for the frontend.
- [Render](https://render.com) — free **web** + free **Postgres** (the web service **spins down** when idle; first request can be ~30s–1min cold start — normal on free).

---

## Part 1 — Push the project to GitHub (if you have not)

1. Create a new empty repo on GitHub (no README if you will push an existing project).
2. In the project folder:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

---

## Part 2 — Render: PostgreSQL + .NET API (Docker)

### Option A — Use the included `render.yaml` (fastest)

1. Log in to [Render](https://dashboard.render.com).
2. **Blueprints** → **New Blueprint Instance**.
3. Connect the GitHub repo that contains this project.
4. Use the default **Blueprint path** `render.yaml` (at the repo root).
5. Approve the create. Render will:
   - Create a **Postgres** database (`kiryana-db` in the file).
   - Create a **Web Service** that builds `backend/Dockerfile` and sets **`DATABASE_URL`** from that database.
6. Wait until the **Web Service** shows **Live** (build can take several minutes the first time).
7. Open the service → **URL** (e.g. `https://kiryana-api.onrender.com`).  
   - Check: `https://<that-host>/api/items` should return JSON (or `[]` right after first deploy while seeding runs).
8. If the build fails, open **Logs** and fix (common issues: wrong `rootDir`, or Dockerfile path — this repo uses `rootDir: backend` and `dockerfilePath: ./Dockerfile`).

**How the app sees the database**

- Render injects `DATABASE_URL` (often a `postgres://...` URL). The API turns that into an Npgsql connection string and runs EF migrations on startup.

### Option B — Manual (Dashboard)

1. **New** → **PostgreSQL** → name it (e.g. `kiryana-db`) → plan **Free** → create.
2. In the database page, copy the **Internal Database URL** (or the URL Render shows for apps in the same region). It will look like `postgres://...` or `postgresql://...`.
3. **New** → **Web Service** → connect the same GitHub repo.
4. **Settings**:
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile` (relative to `backend`, so the file is `backend/Dockerfile`)
5. **Environment**:
   - `ASPNETCORE_URLS` = `http://0.0.0.0:8080`
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `DATABASE_URL` = *(paste the Postgres URL from step 2; use **Internal** URL if the web service and DB are in the same Render region)*
6. **Save** and deploy. Use the public **Web Service URL** for the next part.

---

## Part 3 — Vercel: React build

1. Log in to [Vercel](https://vercel.com) → **Add New** → **Project** → import the **same** GitHub repo.
2. **Framework Preset**: Vite.
3. **Root Directory**: `frontend` (click Edit).
4. **Build & Output**:
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (Vite default).
5. **Environment Variables** (Production):
   - **Name**: `VITE_API_URL`  
   - **Value**: your **Render API base URL only**, with **https**, **no** trailing slash, **no** `/api`  
   - Example: `https://kiryana-api.onrender.com`
6. Deploy. Your **Vercel URL** (e.g. `https://kiryana-store.vercel.app`) is the link you usually submit for the **frontend** (it talks to Render in the background).

**Why this variable**

- `frontend/src/services/api.js` does `baseURL: \`${API_BASE}/api\``. So the browser calls `https://<render-host>/api/...` — the API must be the Render URL.

**CORS**

- The API already allows any origin; no extra CORS config is required for a typical Vercel + Render setup.

---

## Part 4 — What to submit

- **Main link (assessment)**: the **Vercel** production URL.
- **Optional**: add the **Render** API base URL in the README or report so the marker can test `/swagger` on the same host: `https://<render-host>/swagger`.

---

## Local dev (Postgres, not SQL Server)

- **Docker**: from the repo root, `cp .env.example .env`, set `POSTGRES_PASSWORD`, then `docker compose up --build`.  
  - Frontend: `http://localhost:13000`  
  - API: `http://localhost:18080`  
  - Postgres: `localhost:5432`
- **Without Docker**: install PostgreSQL, create user/db matching `appsettings.Development.json`, then run the API and `npm run dev` in `frontend` with `VITE_API_URL=http://localhost:18080` in `frontend/.env` if you hit CORS; same-origin is not an issue if you use the docker nginx setup.

---

## EF migrations (if you change the model)

```bash
cd backend
dotnet ef migrations add YourMigrationName --project src/KiryanaStore.Infrastructure --startup-project src/KiryanaStore.API
```

Push to GitHub; Render will rebuild. Migrations run automatically on API startup (`Program.cs`).

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| Vercel shows blank / API errors | `VITE_API_URL` must be the **Render** URL, `https`, no `/api` suffix. Redeploy Vercel after changing env. |
| Render 502 / timeout on first open | Free tier **cold start**; wait and refresh. |
| DB connection errors on Render | Same region; use **Internal** `DATABASE_URL` for the web service; check Render DB is **available**. If logs show **127.0.0.1:5432**, the app was using `appsettings.json` localhost — **DATABASE_URL** must take priority (fixed in `ConnectionStringResolver`); redeploy. |
| Migrations fail | Logs on Render; ensure `DATABASE_URL` is set and reachable. |
| **Deploy exit 139** (or crash on boot) | Often wrong listen **port** on PaaS: the API must use Render’s `PORT` env (often `10000`, not `8080`). `Program.cs` sets `ASPNETCORE_URLS` from `PORT` before `CreateBuilder`. If it still fails, open the **full deploy log** (not only the events list) and check for OOM, DB SSL, or migration errors. |
