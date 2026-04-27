# Run 24/7 (not on your PC)

A **Cloudflare “quick tunnel”** URL is **temporary**. When your PC, Docker, or the tunnel stops, the DNS name stops working. For an **assessment link that always works**, you need **real cloud hosting**.

This repo gives you two practical paths.

---

## Option A (recommended for .NET + SQL Server): Azure

You need an **Azure account** (Azure for Students / free credits are fine). **App Service on Linux for containers** is **not** on the permanent “free F1” tier; use at least a **Basic (B1)** app plan (small monthly cost, or paid by student credit).

### 1) Create resources with Bicep

From a terminal (with [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and `az login` done):

```bash
az group create -n kiryana-rg -l eastus

az deployment group create ^
  -g kiryana-rg ^
  -f infra/azure/main.bicep ^
  -p sqlAdminPassword="YOUR_STRONG_PASSWORD_HERE" ^
  -p containerImage="ghcr.io/YOUR_GH_USER/kiryana-store-app:latest"
```

Replace the image with the one you will push (see below). The template deploys **Azure SQL** and a **Web App** wired with connection string `DefaultConnection` (what the API already reads).

### 2) Build and push the “cloud” image (API + React in one container)

The image is built from the repo root using `deploy/Dockerfile.cloud` (Kestrel serves the React `wwwroot` and `/api` on the same host, so you do not need nginx in front).

**GitHub (easiest):** push to `main` and open **Actions** — workflow `Build and push cloud image` publishes to **GHCR**:

- `ghcr.io/<your-username-or-org>/<repo-name>:latest`

Make the package **public** in GitHub (Package settings) if the registry should pull without a token.

### 3) Point the Web App at your image

In the Azure Portal: **App Service** → **Deployment** → **Container** → set image to your `ghcr.io/...:latest` (same as in Bicep or update with **Configuration**). If the registry is private, add registry credentials in the Web App or use a managed identity (see Azure docs).

### 4) Your public URL

Open `https://<webappname>.azurewebsites.net` (from the deployment output or App Service **Overview**).

**Notes**

- First cold start can take a minute; EF migrations run on startup.
- This is a real deploy with a billable (or credit-backed) service — not a free “always on” tunnel.

---

## Option B: Free VM (Oracle Cloud “Always Free” or similar) + Docker Compose

If you cannot use Azure, run the **same** `docker compose` stack on a small **always-on VM** in the cloud:

1. Create a free-tier VM (e.g. Oracle Cloud Always Free AMD or ARM).
2. Install Docker.
3. Clone this repo, copy `.env.example` to `.env`, set `MSSQL_SA_PASSWORD`, open ports for the frontend (e.g. 13000) in the cloud firewall.
4. `docker compose up -d --build`
5. Use the VM **public IP** (or a domain) as the submission link. For HTTPS, add Caddy or nginx with Let’s Encrypt (optional).

This stays **$0** on some providers but you maintain the server yourself.

---

## What changed in the app for “one URL” in the cloud

`Program.cs` serves the React build from `wwwroot` when `wwwroot/index.html` is present. The `deploy/Dockerfile.cloud` builds the frontend and copies it into the API project before `dotnet publish`, so one container serves both the UI and `/api`.

Local **docker-compose** (three containers + nginx) is unchanged for development.
