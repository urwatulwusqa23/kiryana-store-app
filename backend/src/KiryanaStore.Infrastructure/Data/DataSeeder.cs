using KiryanaStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Customers.AnyAsync()) return;

        var customers = new[]
        {
            new Customer { Name = "Ahmed Khan", Phone = "0301-1234567", Address = "Gulberg, Lahore" },
            new Customer { Name = "Sara Bibi", Phone = "0322-9876543", Address = "Model Town, Lahore" },
            new Customer { Name = "Usman Ali", Phone = "0311-5555555", Address = "DHA, Lahore" }
        };
        db.Customers.AddRange(customers);
        await db.SaveChangesAsync();

        var txs = new[]
        {
            new CreditTransaction { CustomerId = customers[0].Id, Amount = 500, Type = TransactionType.Credit, Note = "Groceries" },
            new CreditTransaction { CustomerId = customers[0].Id, Amount = 200, Type = TransactionType.Payment, Note = "Partial payment" },
            new CreditTransaction { CustomerId = customers[1].Id, Amount = 1200, Type = TransactionType.Credit, Note = "Monthly supplies" },
            new CreditTransaction { CustomerId = customers[2].Id, Amount = 750, Type = TransactionType.Credit, Note = "Weekly items" },
            new CreditTransaction { CustomerId = customers[2].Id, Amount = 750, Type = TransactionType.Payment, Note = "Full payment" },
        };
        db.CreditTransactions.AddRange(txs);

        var items = new[]
        {
            new Item { Name = "Basmati Rice (1kg)", Unit = "kg", CostPrice = 120, SellingPrice = 150, Quantity = 50, LowStockThreshold = 10 },
            new Item { Name = "Cooking Oil (1L)", Unit = "litre", CostPrice = 250, SellingPrice = 300, Quantity = 30, LowStockThreshold = 10 },
            new Item { Name = "Sugar (1kg)", Unit = "kg", CostPrice = 80, SellingPrice = 100, Quantity = 4, LowStockThreshold = 5 },
            new Item { Name = "Tea Bags (100pcs)", Unit = "box", CostPrice = 180, SellingPrice = 220, Quantity = 20, LowStockThreshold = 5 },
            new Item { Name = "Flour (5kg)", Unit = "bag", CostPrice = 350, SellingPrice = 420, Quantity = 2, LowStockThreshold = 5 }
        };
        db.Items.AddRange(items);
        await db.SaveChangesAsync();

        var suppliers = new[]
        {
            new Supplier { Name = "Tariq Mehmood", Phone = "0300-1111111", Company = "Al-Noor Traders" },
            new Supplier { Name = "Bilal Hussain", Phone = "0333-2222222", Company = "City Wholesale" }
        };
        db.Suppliers.AddRange(suppliers);
        await db.SaveChangesAsync();

        var purchase = new Purchase
        {
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
