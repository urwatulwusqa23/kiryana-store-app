# Smart Kiryana Assistant

A full-stack, multi-tenant management platform for neighbourhood *kiryana* (grocery) stores — inventory, billing, customer credit (udhaar/khata), suppliers, delivery orders, expenses, and analytics for shop owners, plus location-based storefronts for customers and a live delivery tracker for riders, all in one app.

**Live demo:** https://kiryanastore-git-main-urwatulwusqa23s-projects.vercel.app/

---

## What's in the box

The app has **three portals** behind one entry screen:

| Portal | Who it's for | Login |
|---|---|---|
| **Owner Portal** | Shop owner / staff | Real JWT login — see [demo accounts](#demo-accounts) |
| **Customer Portal** | Shoppers | No login — anonymous, location-based store discovery, order tracked via a device-local reference |
| **Rider Portal** | Delivery riders | Real JWT login, scoped to that rider's own assigned deliveries |

### Owner Portal
- **Dashboard** — today/month revenue, profit, low-stock alerts, recent sales
- **Billing** — point-of-sale checkout with barcode scanning (`@zxing/browser`)
- **Orders** — delivery workflow (Pending → Confirmed → Picked Up → On the Way → Delivered), rider assignment
- **Udhaar Book (Customers)** — customer credit ledger, payments, running balances
- **Inventory** — item catalog, stock levels, low-stock thresholds
- **Suppliers & Purchases** — supplier records and purchase history
- **Kharcha Khata (Expenses)** — categorized expense tracking (rent, wages, utilities, etc.) with insights and WhatsApp-style export
- **Analytics** — sales trends, udhaar risk breakdown, stock health
- **Staff & Riders** — manage employee and rider accounts
- **WhatsApp Reminders** — payment reminder message generator for customers with outstanding balances

### Customer Portal
- Share your location (or browse manually) to find **nearby stores**, sorted by distance
- Browse a store's live stock with category-colored product cards (produce, dairy, bakery, beverages, snacks, meat, etc. — auto-detected from item names)
- Add to cart, check out with a delivery address — no account required
- Track your order live through every delivery stage
- Order history persists via a locally-stored reference, not a real login

### Rider Portal
- Log in with a real rider account to see only your own assigned deliveries (plus unassigned pending orders you can pick up)
- Advance an order through Picked Up → On the Way → Delivered with one tap

---

## Tech Stack

- **Backend**: .NET 8, Clean Architecture (`Domain` / `Application` / `Infrastructure` / `API`), EF Core, PostgreSQL, JWT auth with role-based authorization, PBKDF2 password hashing, per-endpoint rate limiting
- **Frontend**: React 18 + Vite, Tailwind CSS, React Router, Axios
- **Database**: PostgreSQL, multi-tenant via a global `StoreId` query filter on every tenant-scoped table, with indexes on `StoreId` and common filter columns
- **Deployment**: Docker Compose (local, all-in-one), or Vercel (frontend) + Render (backend + Postgres) for a public 24/7 URL

---

## Project Structure

```
kiryana store/
├── docker-compose.yml
├── backend/                              .NET 8 Clean Architecture
│   ├── KiryanaStore.sln
│   └── src/
│       ├── KiryanaStore.Domain/          Entities: Store, User, Customer, CustomerAccount,
│       │                                 CreditTransaction, Item, Supplier, Purchase,
│       │                                 PurchaseItem, Sale, SaleItem, Expense
│       ├── KiryanaStore.Application/     Services, DTOs, password hashing
│       ├── KiryanaStore.Infrastructure/  EF Core DbContext, repositories, migrations, seed data
│       └── KiryanaStore.API/             Controllers, Program.cs, JWT/rate-limit config
├── frontend/                             React + Tailwind
│   └── src/
│       ├── pages/                        Dashboard, Billing, Inventory, Customers, Suppliers,
│       │                                 Orders, Analytics, KharchaKhata, Staff,
│       │                                 WhatsAppReminders, Login, Signup
│       ├── portals/                      CustomerPortal, RiderPortal
│       ├── components/                   BarcodeScanner, GroceryBackdrop, GroceryIllustration
│       ├── utils/                        productCategory (grocery category classifier)
│       ├── store/                        orderStore (order state/API glue)
│       └── services/api.js               Axios client, one export per resource
└── docs/                                 Deployment guides
```

### Backend API surface

| Controller | Auth | Notes |
|---|---|---|
| `AuthController` | — | Login, self-service store registration (rate-limited) |
| `HealthController` | Public | Health check |
| `StoresController` | Public | Nearby-store search (Haversine distance), per-store public item listing |
| `ItemsController` | Owner/Employee | Inventory CRUD, low-stock query |
| `CustomersController` | Owner/Employee | Customer CRUD, credit transactions, paginated |
| `SuppliersController` | Owner/Employee | Supplier CRUD |
| `PurchasesController` | Owner/Employee | Purchase records |
| `SalesController` | Owner/Employee | POS sale creation, paginated |
| `OrdersController` | Mixed | Delivery workflow (Owner/Employee/Rider), plus `[AllowAnonymous]` order placement + lookup for the Customer Portal (server-generated, rate-limited lookup reference — no client-guessable IDs) |
| `ExpensesController` | Owner | Expense CRUD, date-range filtered, paginated |
| `UsersController` | Owner | Staff/rider account management |

---

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
| Swagger     | http://localhost:18080/swagger *(dev only — disabled in production)* |
| PostgreSQL  | localhost:15432                  |

Demo data (a store, users, customers, inventory, orders, expenses, and three extra nearby demo stores for the location feature) seeds automatically on first run against an empty database.

### Option 2: Run backend and frontend separately

**Backend**
1. Start Postgres (`docker compose up postgres`, or a local install).
2. Run from the CLI:
   ```bash
   cd backend
   dotnet run --project src/KiryanaStore.API
   ```
3. Check `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` (defaults to `localhost:5432`, user `kiryana`, db `kiryanadb`). EF migrations and seeding run automatically on startup.
4. Swagger UI (dev only): `https://localhost:<port>/swagger`

**Frontend**
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to your backend URL
npm install
npm run dev             # http://localhost:3000
```

### Regenerating EF migrations

```bash
cd backend/src/KiryanaStore.API
dotnet ef migrations add <MigrationName> --project ../KiryanaStore.Infrastructure --startup-project .
```
Migrations apply automatically on next backend startup via `db.Database.Migrate()` — no manual `database update` step needed.

---

## Demo Accounts

Seeded automatically on first run (Owner Portal / Rider Portal login):

| Role | Username | Password | Notes |
|---|---|---|---|
| Owner | `admin` | `admin123` | Full access — "Ahmed General Store" |
| Employee | `employee` | `employee123` | Restricted view — no Suppliers/Analytics/Kharcha Khata/Staff |
| Rider | `asif` | `rider123` | Own deliveries only |
| Rider | `bilal` | `rider123` | Own deliveries only |

The Customer Portal needs no account — pick a store and shop.

---

## Authentication & Security

- All `/api/*` endpoints except `/api/auth/login`, `/api/health`, and the public `/api/stores/*` routes require a JWT bearer token, enforced with `[Authorize(Roles = "...")]` per controller/action.
- Passwords are hashed with salted PBKDF2 (100k iterations) and verified with a constant-time comparison.
- Multi-tenancy is enforced by a global EF Core query filter (`StoreId == currentUser.StoreId`) on every tenant-scoped entity — no controller can accidentally leak another store's data.
- The two anonymous Customer Portal endpoints (order placement + "my orders" lookup) use a server-generated, cryptographically random lookup reference (never client-supplied) and are rate-limited per IP.
- Self-service store registration (`POST /api/auth/register-store`) and login (`POST /api/auth/login`) are rate-limited per IP.
- Swagger UI is only served in the Development environment.

**Production config** (see `render.yaml`): `Jwt__Secret`, `Cors__AllowedOrigins__*`, and the Postgres connection string must be set via environment variables. Use a long, random `Jwt__Secret` — do not ship the local dev fallback.

---

## Deployment

For a 24/7 public URL:

- **Vercel (frontend) + Render (backend + Postgres)** — see [docs/DEPLOY-VERCEL-RENDER-POSTGRES.md](docs/DEPLOY-VERCEL-RENDER-POSTGRES.md) — matches this repo's current stack and is what the live demo runs on.
- **Azure** — see [docs/DEPLOY-24-7-ALWAYS-ON.md](docs/DEPLOY-24-7-ALWAYS-ON.md). Note: the sample Bicep targets Azure SQL, but this app uses Postgres — adapt it or point it at a managed Postgres instance.

See [SETUP.md](SETUP.md) for the original detailed setup guide.
