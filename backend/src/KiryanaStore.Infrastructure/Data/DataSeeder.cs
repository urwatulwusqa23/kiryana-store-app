using KiryanaStore.Application.Auth;
using KiryanaStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Query filters scope to the current request's StoreId, which doesn't exist at
        // startup, so every check/query here must bypass them explicitly.
        if (await db.Stores.IgnoreQueryFilters().AnyAsync()) return;

        var store = new Store { Name = "Ahmed General Store", Slug = "ahmed-general-store", City = "Lahore", Address = "Gulberg III, Lahore", Phone = "03XX-1234567" };
        db.Stores.Add(store);
        await db.SaveChangesAsync();

        var users = new[]
        {
            new User { StoreId = store.Id, Username = "admin", PasswordHash = PasswordHasher.Hash("admin123"), Role = UserRole.Owner, FullName = "Ahmed Khan (Owner)" },
            new User { StoreId = store.Id, Username = "employee", PasswordHash = PasswordHasher.Hash("employee123"), Role = UserRole.Employee, FullName = "Staff Cashier" },
            new User { StoreId = store.Id, Username = "asif", PasswordHash = PasswordHasher.Hash("rider123"), Role = UserRole.Rider, FullName = "Asif Khan", Phone = "0300-1111111" },
            new User { StoreId = store.Id, Username = "bilal", PasswordHash = PasswordHasher.Hash("rider123"), Role = UserRole.Rider, FullName = "Bilal Ahmed", Phone = "0300-2222222" },
        };
        db.Users.AddRange(users);

        var customers = new[]
        {
            new Customer { StoreId = store.Id, Name = "Ahmed Khan", Phone = "0301-1234567", Address = "Gulberg, Lahore" },
            new Customer { StoreId = store.Id, Name = "Sara Bibi", Phone = "0322-9876543", Address = "Model Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Usman Ali", Phone = "0311-5555555", Address = "DHA, Lahore" }
        };
        db.Customers.AddRange(customers);
        await db.SaveChangesAsync();

        var txs = new[]
        {
            new CreditTransaction { StoreId = store.Id, CustomerId = customers[0].Id, Amount = 500, Type = TransactionType.Credit, Note = "Groceries" },
            new CreditTransaction { StoreId = store.Id, CustomerId = customers[0].Id, Amount = 200, Type = TransactionType.Payment, Note = "Partial payment" },
            new CreditTransaction { StoreId = store.Id, CustomerId = customers[1].Id, Amount = 1200, Type = TransactionType.Credit, Note = "Monthly supplies" },
            new CreditTransaction { StoreId = store.Id, CustomerId = customers[2].Id, Amount = 750, Type = TransactionType.Credit, Note = "Weekly items" },
            new CreditTransaction { StoreId = store.Id, CustomerId = customers[2].Id, Amount = 750, Type = TransactionType.Payment, Note = "Full payment" },
        };
        db.CreditTransactions.AddRange(txs);

        var items = new[]
        {
            new Item { StoreId = store.Id, Name = "Basmati Rice (1kg)", Unit = "kg", CostPrice = 120, SellingPrice = 150, Quantity = 50, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Cooking Oil (1L)", Unit = "litre", CostPrice = 250, SellingPrice = 300, Quantity = 30, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Sugar (1kg)", Unit = "kg", CostPrice = 80, SellingPrice = 100, Quantity = 4, LowStockThreshold = 5 },
            new Item { StoreId = store.Id, Name = "Tea Bags (100pcs)", Unit = "box", CostPrice = 180, SellingPrice = 220, Quantity = 20, LowStockThreshold = 5 },
            new Item { StoreId = store.Id, Name = "Flour (5kg)", Unit = "bag", CostPrice = 350, SellingPrice = 420, Quantity = 2, LowStockThreshold = 5 }
        };
        db.Items.AddRange(items);
        await db.SaveChangesAsync();

        var suppliers = new[]
        {
            new Supplier { StoreId = store.Id, Name = "Tariq Mehmood", Phone = "0300-1111111", Company = "Al-Noor Traders" },
            new Supplier { StoreId = store.Id, Name = "Bilal Hussain", Phone = "0333-2222222", Company = "City Wholesale" }
        };
        db.Suppliers.AddRange(suppliers);
        await db.SaveChangesAsync();

        var purchase = new Purchase
        {
            StoreId = store.Id,
            SupplierId = suppliers[0].Id,
            Notes = "Monthly stock purchase",
            TotalCost = 10000,
            Items = new List<PurchaseItem>
            {
                new PurchaseItem { ItemId = items[0].Id, Quantity = 20, UnitCost = 120 },
                new PurchaseItem { ItemId = items[1].Id, Quantity = 10, UnitCost = 250 }
            }
        };
        db.Purchases.Add(purchase);

        var sale = new Sale
        {
            StoreId = store.Id,
            CustomerName = "Walk-in",
            TotalRevenue = 600,
            TotalCost = 480,
            Items = new List<SaleItem>
            {
                new SaleItem { ItemId = items[0].Id, Quantity = 2, UnitPrice = 150, UnitCost = 120 },
                new SaleItem { ItemId = items[2].Id, Quantity = 3, UnitPrice = 100, UnitCost = 80 }
            }
        };
        db.Sales.Add(sale);
        await db.SaveChangesAsync();
    }
}
