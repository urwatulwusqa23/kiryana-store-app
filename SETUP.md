# Smart Kiryana Assistant — Setup Guide

## Project Structure

```
kiryana store/
├── docker-compose.yml          ← Run everything with one command
├── backend/                    ← .NET 8 Clean Architecture
│   ├── KiryanaStore.sln        ← Open this in Visual Studio
│   └── src/
│       ├── KiryanaStore.Domain/        ← Entities + Interfaces
│       ├── KiryanaStore.Application/   ← Services + DTOs
│       ├── KiryanaStore.Infrastructure/← EF Core + Repositories
│       └── KiryanaStore.API/           ← Controllers + Program.cs
└── frontend/                   ← React + Tailwind CSS
    └── src/
        ├── pages/              ← Dashboard, Customers, Inventory, Suppliers, Billing
        └── services/api.js     ← All API calls
```

---

## Option 1: Docker (Recommended — One Command)

### Prerequisites
- Docker Desktop installed and running

### Run
```bash
cd "kiryana store"
cp .env.example .env
# Edit .env if you want a different SQL Server password
docker compose up --build
```

| Service    | URL                         |
|------------|-----------------------------|
| Frontend   | http://localhost:13000      |
| Backend API| http://localhost:18080      |
| Swagger    | http://localhost:18080/swagger |
| SQL Server | localhost:1433              |

Demo data is auto-seeded on first run.

---

## Option 2: Visual Studio (Backend) + Vite (Frontend)

### Backend — Visual Studio

1. Open `backend/KiryanaStore.sln` in Visual Studio 2022
2. Make sure you have SQL Server running (LocalDB, Express, or Docker):
   ```bash
   # Quick SQL Server via Docker:
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=ChangeThisStrongPassword123!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
   ```
3. Check `appsettings.json` connection string (default targets `localhost,1433`)
4. Press **F5** to run — EF migrations + seeding happen automatically on startup
5. Swagger opens at https://localhost:7xxx/swagger

### Frontend — VS Code / Terminal

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_URL=https://localhost:7xxx (your backend port)
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Option 3: Regenerate EF Migrations (if needed)

```bash
cd backend
dotnet ef migrations add InitialCreate --project src/KiryanaStore.Infrastructure --startup-project src/KiryanaStore.API
dotnet ef database update --project src/KiryanaStore.Infrastructure --startup-project src/KiryanaStore.API
```

---

## API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/sales/dashboard              | Dashboard stats          |
| GET    | /api/customers                    | All customers + balances |
| POST   | /api/customers                    | Add customer             |
| POST   | /api/customers/transactions       | Add credit/payment       |
| GET    | /api/items                        | All inventory            |
| GET    | /api/items/low-stock              | Low stock items          |
| GET    | /api/suppliers                    | All suppliers            |
| GET    | /api/purchases/supplier/{id}      | Purchases by supplier    |
| POST   | /api/sales                        | Create sale (billing)    |

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS  |
| Backend     | ASP.NET Core 8, Clean Arch    |
| ORM         | Entity Framework Core 8       |
| Database    | SQL Server 2022               |
| Container   | Docker + Docker Compose       |
| API Docs    | Swagger / OpenAPI             |

---

## Demo Data (Auto-Seeded)

- **3 Customers**: Ahmed Khan (Rs. 300 udhaar), Sara Bibi (Rs. 1200 udhaar), Usman Ali (settled)
- **5 Items**: Basmati Rice, Cooking Oil, Sugar (low stock), Tea Bags, Flour (low stock)
- **2 Suppliers**: Al-Noor Traders, City Wholesale
- Sample purchase and sale transactions
