# Smart Kiryana Assistant

A full-stack point-of-sale and business management app for small Indian *kiryana* (grocery) stores — inventory, billing, customer credit (khata), suppliers, and sales analytics in one dashboard.

## Tech Stack

- **Backend**: .NET 8, Clean Architecture (Domain / Application / Infrastructure / API), EF Core, PostgreSQL
- **Frontend**: React 18 + Vite, Tailwind CSS, React Router, Axios
- **Database**: PostgreSQL
- **Deployment**: Docker Compose (local), Vercel (frontend) + Render (backend + Postgres) for a 24/7 public URL
https://kiryanastore-git-main-urwatulwusqa23s-projects.vercel.app/

## Features

- **Dashboard** — sales summary, key stats at a glance
- **Billing** — create sales, barcode scanning (`@zxing/browser`)
- **Inventory** — item catalog, stock levels, low-stock alerts
- **Customers & Khata** — customer credit ledger, payments, balances
- **Suppliers & Purchases** — supplier records, purchase history
- **Orders / Analytics** — sales trends and reporting
- **WhatsApp Reminders** — payment reminder messages for customers

## Project Structure

```
kiryana store/
├── docker-compose.yml
├── backend/                        .NET 8 Clean Architecture
│   ├── KiryanaStore.sln
│   └── src/
│       ├── KiryanaStore.Domain/         Entities (Customer, Item, Sale, Purchase, Supplier, ...)
│       ├── KiryanaStore.Application/    Services, DTOs
│       ├── KiryanaStore.Infrastructure/ EF Core, repositories
│       └── KiryanaStore.API/            Controllers, Program.cs
├── frontend/                       React + Tailwind
│   └── src/
│       ├── pages/                       Dashboard, Billing, Inventory, Customers, Suppliers, Orders, Analytics, KharchaKhata, WhatsAppReminders
│       └── services/api.js              API client
└── docs/                           Deployment guides
```

## Getting Started

### Option 1: Docker (recommended)

Requires Docker Desktop.

```bash
cp .env.example .env
# set POSTGRES_PASSWORD in .env (or use the local dev default)
docker compose up --build
```

| Service     | URL                             |
|-------------|----------------------------------|
| Frontend    | http://localhost:13000          |
| Backend API | http://localhost:18080          |
| Swagger     | http://localhost:18080/swagger  |
| PostgreSQL  | localhost:5432                  |

Demo data seeds automatically on first run.

### Option 2: Run backend and frontend separately

**Backend**
1. Start Postgres (`docker compose up postgres`, or a local install).
2. Open `backend/KiryanaStore.sln` (Visual Studio) or run from the CLI:
   ```bash
   cd backend
   dotnet run --project src/KiryanaStore.API
   ```
3. Check `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` (defaults to `localhost:5432`, user `kiryana`, db `kiryanadb`). EF migrations and seeding run automatically on startup.
4. Swagger UI: `https://localhost:<port>/swagger`

**Frontend**
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to your backend URL
npm install
npm run dev             # http://localhost:3000
```

### Regenerating EF migrations

```bash
cd backend
dotnet ef migrations add InitialCreate --project src/KiryanaStore.Infrastructure --startup-project src/KiryanaStore.API
dotnet ef database update --project src/KiryanaStore.Infrastructure --startup-project src/KiryanaStore.API
```

## Authentication

All `/api/*` endpoints except `/api/auth/login` and `/api/health` require a JWT bearer token.

- **Local dev**: default credentials are `admin` / `admin123` (set in `appsettings.Development.json`). The frontend owner portal shows a login screen that calls `POST /api/auth/login` and stores the token.
- **Production**: `Jwt:Secret`, `AdminUser:Username`, `AdminUser:PasswordHash` (SHA-256 hex of the password) and `Cors:AllowedOrigins` must be set via environment variables (`Jwt__Secret`, `AdminUser__Username`, etc.) — see `render.yaml`. The API refuses to serve requests without these configured.

## API Endpoints

| Method | Endpoint                     | Description               |
|--------|-------------------------------|----------------------------|
| POST   | /api/auth/login                | Log in, returns JWT        |
| GET    | /api/health                    | Public health check        |
| GET    | /api/sales/dashboard          | Dashboard stats            |
| GET    | /api/customers                 | All customers + balances   |
| POST   | /api/customers                 | Add customer                |
| POST   | /api/customers/transactions    | Add credit / payment        |
| GET    | /api/items                     | All inventory                |
| GET    | /api/items/low-stock           | Low stock items              |
| GET    | /api/suppliers                 | All suppliers                 |
| GET    | /api/purchases/supplier/{id}   | Purchases by supplier         |
| POST   | /api/sales                     | Create sale (billing)         |

## Deployment

For a 24/7 public URL:

- **Vercel (frontend) + Render (backend + Postgres)** — see [docs/DEPLOY-VERCEL-RENDER-POSTGRES.md](docs/DEPLOY-VERCEL-RENDER-POSTGRES.md) — matches this repo's current stack.
- **Azure** — see [docs/DEPLOY-24-7-ALWAYS-ON.md](docs/DEPLOY-24-7-ALWAYS-ON.md). Note: the sample Bicep targets Azure SQL, but this app uses Postgres — adapt it or use a managed Postgres instance.

See [SETUP.md](SETUP.md) for the original detailed setup guide.
