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

        var now = DateTime.UtcNow;

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
            new Customer { StoreId = store.Id, Name = "Ahmed Khan",     Phone = "0301-1234567", Address = "Gulberg, Lahore" },
            new Customer { StoreId = store.Id, Name = "Sara Bibi",      Phone = "0322-9876543", Address = "Model Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Usman Ali",      Phone = "0311-5555555", Address = "DHA, Lahore" },
            new Customer { StoreId = store.Id, Name = "Fatima Sheikh",  Phone = "0333-4455667", Address = "Johar Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Bilal Yousuf",   Phone = "0345-1122334", Address = "Township, Lahore" },
            new Customer { StoreId = store.Id, Name = "Ayesha Malik",   Phone = "0300-9988776", Address = "Wapda Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Hamza Iqbal",    Phone = "0321-6677889", Address = "Faisal Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Zainab Raza",    Phone = "0312-3344556", Address = "Cavalry Ground, Lahore" },
            new Customer { StoreId = store.Id, Name = "Imran Chaudhry", Phone = "0303-7788990", Address = "Garden Town, Lahore" },
            new Customer { StoreId = store.Id, Name = "Mehwish Tariq",  Phone = "0334-2233445", Address = "Iqbal Town, Lahore" },
        };
        db.Customers.AddRange(customers);
        await db.SaveChangesAsync();

        var txs = new List<CreditTransaction>();
        void AddTx(Customer c, decimal amount, TransactionType type, string note, int daysAgo) =>
            txs.Add(new CreditTransaction { StoreId = store.Id, CustomerId = c.Id, Amount = amount, Type = type, Note = note, CreatedAt = now.AddDays(-daysAgo) });

        AddTx(customers[0], 500, TransactionType.Credit, "Groceries", 20);
        AddTx(customers[0], 200, TransactionType.Payment, "Partial payment", 12);
        AddTx(customers[1], 1200, TransactionType.Credit, "Monthly supplies", 25);
        AddTx(customers[1], 3800, TransactionType.Credit, "Eid stock-up", 8);
        AddTx(customers[2], 750, TransactionType.Credit, "Weekly items", 15);
        AddTx(customers[2], 750, TransactionType.Payment, "Full payment", 9);
        AddTx(customers[3], 6200, TransactionType.Credit, "Wedding function order", 18);
        AddTx(customers[3], 1000, TransactionType.Payment, "Partial payment", 5);
        AddTx(customers[4], 300, TransactionType.Credit, "Daily items", 3);
        AddTx(customers[5], 7500, TransactionType.Credit, "Monthly ration", 22);
        AddTx(customers[5], 2500, TransactionType.Payment, "Partial payment", 6);
        AddTx(customers[6], 450, TransactionType.Credit, "Snacks and drinks", 2);
        AddTx(customers[7], 5300, TransactionType.Credit, "Household supplies", 14);
        AddTx(customers[8], 180, TransactionType.Credit, "Bread and milk", 1);
        AddTx(customers[9], 900, TransactionType.Credit, "Weekly items", 7);
        AddTx(customers[9], 900, TransactionType.Payment, "Full payment", 4);
        db.CreditTransactions.AddRange(txs);

        var items = new[]
        {
            new Item { StoreId = store.Id, Name = "Basmati Rice (1kg)",     Unit = "kg",    CostPrice = 120, SellingPrice = 150, Quantity = 50, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Cooking Oil (1L)",       Unit = "litre", CostPrice = 250, SellingPrice = 300, Quantity = 30, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Sugar (1kg)",            Unit = "kg",    CostPrice = 80,  SellingPrice = 100, Quantity = 4,  LowStockThreshold = 5  },
            new Item { StoreId = store.Id, Name = "Tea Bags (100pcs)",      Unit = "box",   CostPrice = 180, SellingPrice = 220, Quantity = 20, LowStockThreshold = 5  },
            new Item { StoreId = store.Id, Name = "Flour (5kg)",            Unit = "bag",   CostPrice = 350, SellingPrice = 420, Quantity = 2,  LowStockThreshold = 5  },
            new Item { StoreId = store.Id, Name = "Salt (800g)",            Unit = "pack",  CostPrice = 30,  SellingPrice = 45,  Quantity = 40, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Red Lentils (1kg)",      Unit = "kg",    CostPrice = 210, SellingPrice = 260, Quantity = 25, LowStockThreshold = 8  },
            new Item { StoreId = store.Id, Name = "Chickpeas (1kg)",        Unit = "kg",    CostPrice = 190, SellingPrice = 240, Quantity = 18, LowStockThreshold = 8  },
            new Item { StoreId = store.Id, Name = "Milk (1L Tetra Pack)",   Unit = "litre", CostPrice = 190, SellingPrice = 220, Quantity = 0,  LowStockThreshold = 12 },
            new Item { StoreId = store.Id, Name = "Eggs (Dozen)",           Unit = "dozen", CostPrice = 280, SellingPrice = 330, Quantity = 15, LowStockThreshold = 6  },
            new Item { StoreId = store.Id, Name = "Bread (Large)",          Unit = "pack",  CostPrice = 90,  SellingPrice = 120, Quantity = 3,  LowStockThreshold = 5  },
            new Item { StoreId = store.Id, Name = "Detergent Powder (1kg)", Unit = "pack",  CostPrice = 220, SellingPrice = 270, Quantity = 22, LowStockThreshold = 8  },
            new Item { StoreId = store.Id, Name = "Dish Soap (500ml)",      Unit = "bottle",CostPrice = 110, SellingPrice = 140, Quantity = 16, LowStockThreshold = 6  },
            new Item { StoreId = store.Id, Name = "Biscuits (Family Pack)",Unit  = "pack",  CostPrice = 95,  SellingPrice = 130, Quantity = 28, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Soft Drink (1.5L)",      Unit = "bottle",CostPrice = 100, SellingPrice = 130, Quantity = 0,  LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Cigarettes (Pack)",      Unit = "pack",  CostPrice = 260, SellingPrice = 300, Quantity = 34, LowStockThreshold = 10 },
            new Item { StoreId = store.Id, Name = "Potatoes (1kg)",         Unit = "kg",    CostPrice = 60,  SellingPrice = 80,  Quantity = 45, LowStockThreshold = 15 },
            new Item { StoreId = store.Id, Name = "Onions (1kg)",           Unit = "kg",    CostPrice = 55,  SellingPrice = 75,  Quantity = 3,  LowStockThreshold = 15 },
        };
        db.Items.AddRange(items);
        await db.SaveChangesAsync();

        var suppliers = new[]
        {
            new Supplier { StoreId = store.Id, Name = "Tariq Mehmood", Phone = "0300-1111111", Company = "Al-Noor Traders" },
            new Supplier { StoreId = store.Id, Name = "Bilal Hussain", Phone = "0333-2222222", Company = "City Wholesale" },
            new Supplier { StoreId = store.Id, Name = "Naveed Aslam",  Phone = "0321-3333333", Company = "Fresh Farms Supply" },
            new Supplier { StoreId = store.Id, Name = "Kashif Rana",   Phone = "0345-4444444", Company = "Punjab Grocery Depot" },
        };
        db.Suppliers.AddRange(suppliers);
        await db.SaveChangesAsync();

        var purchases = new[]
        {
            new Purchase
            {
                StoreId = store.Id, SupplierId = suppliers[0].Id, Notes = "Monthly stock purchase", TotalCost = 10000, PurchaseDate = now.AddDays(-30),
                Items = new List<PurchaseItem>
                {
                    new PurchaseItem { ItemId = items[0].Id, Quantity = 20, UnitCost = 120 },
                    new PurchaseItem { ItemId = items[1].Id, Quantity = 10, UnitCost = 250 },
                }
            },
            new Purchase
            {
                StoreId = store.Id, SupplierId = suppliers[1].Id, Notes = "Cleaning & household restock", TotalCost = 6820, PurchaseDate = now.AddDays(-22),
                Items = new List<PurchaseItem>
                {
                    new PurchaseItem { ItemId = items[11].Id, Quantity = 20, UnitCost = 220 },
                    new PurchaseItem { ItemId = items[12].Id, Quantity = 20, UnitCost = 110 },
                }
            },
            new Purchase
            {
                StoreId = store.Id, SupplierId = suppliers[2].Id, Notes = "Fresh produce delivery", TotalCost = 5175, PurchaseDate = now.AddDays(-14),
                Items = new List<PurchaseItem>
                {
                    new PurchaseItem { ItemId = items[16].Id, Quantity = 50, UnitCost = 60 },
                    new PurchaseItem { ItemId = items[17].Id, Quantity = 40, UnitCost = 55 },
                }
            },
            new Purchase
            {
                StoreId = store.Id, SupplierId = suppliers[3].Id, Notes = "Pulses & staples restock", TotalCost = 8560, PurchaseDate = now.AddDays(-9),
                Items = new List<PurchaseItem>
                {
                    new PurchaseItem { ItemId = items[6].Id, Quantity = 25, UnitCost = 210 },
                    new PurchaseItem { ItemId = items[7].Id, Quantity = 18, UnitCost = 190 },
                }
            },
            new Purchase
            {
                StoreId = store.Id, SupplierId = suppliers[0].Id, Notes = "Snacks & beverages", TotalCost = 3660, PurchaseDate = now.AddDays(-3),
                Items = new List<PurchaseItem>
                {
                    new PurchaseItem { ItemId = items[13].Id, Quantity = 28, UnitCost = 95 },
                    new PurchaseItem { ItemId = items[9].Id, Quantity = 15, UnitCost = 280 },
                }
            },
        };
        db.Purchases.AddRange(purchases);
        await db.SaveChangesAsync();

        // In-store walk-in sales spread across the last two weeks, so Dashboard/Analytics
        // charts have a real trend line instead of a single flat data point.
        var sales = new List<Sale>();
        var walkInNames = new[] { "Walk-in", "Walk-in", "Ahmed Khan", "Sara Bibi", "Walk-in", "Hamza Iqbal", "Walk-in", "Zainab Raza", "Walk-in", "Imran Chaudhry" };
        var rnd = new Random(42);
        for (int daysAgo = 13; daysAgo >= 0; daysAgo--)
        {
            int saleCount = rnd.Next(2, 5);
            for (int s = 0; s < saleCount; s++)
            {
                var lineCount = rnd.Next(1, 4);
                var saleItems = new List<SaleItem>();
                decimal revenue = 0, cost = 0;
                for (int l = 0; l < lineCount; l++)
                {
                    var item = items[rnd.Next(items.Length)];
                    var qty = rnd.Next(1, 4);
                    saleItems.Add(new SaleItem { ItemId = item.Id, Quantity = qty, UnitPrice = item.SellingPrice, UnitCost = item.CostPrice });
                    revenue += qty * item.SellingPrice;
                    cost += qty * item.CostPrice;
                }
                sales.Add(new Sale
                {
                    StoreId = store.Id,
                    CustomerName = walkInNames[rnd.Next(walkInNames.Length)],
                    TotalRevenue = revenue,
                    TotalCost = cost,
                    SaleDate = now.AddDays(-daysAgo).AddHours(rnd.Next(9, 20)),
                    Items = saleItems,
                });
            }
        }
        db.Sales.AddRange(sales);
        await db.SaveChangesAsync();

        var asif = users[2];
        var bilal = users[3];

        var orders = new[]
        {
            new Sale
            {
                StoreId = store.Id, CustomerName = "Ali Hassan", TotalRevenue = 450, TotalCost = 360,
                OrderStatus = OrderStatus.Pending, DeliveryAddress = "House 12, Model Town, Lahore",
                Items = new List<SaleItem> { new SaleItem { ItemId = items[0].Id, Quantity = 3, UnitPrice = 150, UnitCost = 120 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Sana Malik", TotalRevenue = 300, TotalCost = 250,
                OrderStatus = OrderStatus.Confirmed, DeliveryAddress = "Flat 4B, Johar Town, Lahore",
                RiderId = asif.Id, ConfirmedAt = now.AddMinutes(-40),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[1].Id, Quantity = 1, UnitPrice = 300, UnitCost = 250 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Bilal Tariq", TotalRevenue = 220, TotalCost = 180,
                OrderStatus = OrderStatus.PickedUp, DeliveryAddress = "Street 9, DHA Phase 5, Lahore",
                RiderId = bilal.Id, ConfirmedAt = now.AddHours(-1), PickedUpAt = now.AddMinutes(-30),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[3].Id, Quantity = 1, UnitPrice = 220, UnitCost = 180 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Hina Rafiq", TotalRevenue = 520, TotalCost = 400,
                OrderStatus = OrderStatus.OnTheWay, DeliveryAddress = "House 22, Gulberg III, Lahore",
                RiderId = asif.Id, ConfirmedAt = now.AddHours(-2), PickedUpAt = now.AddHours(-1), OnTheWayAt = now.AddMinutes(-15),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[4].Id, Quantity = 1, UnitPrice = 420, UnitCost = 350 }, new SaleItem { ItemId = items[2].Id, Quantity = 1, UnitPrice = 100, UnitCost = 80 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Usman Farooq", TotalRevenue = 300, TotalCost = 240,
                OrderStatus = OrderStatus.Delivered, DeliveryAddress = "Plot 7, Model Town, Lahore",
                RiderId = bilal.Id, ConfirmedAt = now.AddDays(-1), PickedUpAt = now.AddDays(-1).AddMinutes(20),
                OnTheWayAt = now.AddDays(-1).AddMinutes(35), DeliveredAt = now.AddDays(-1).AddMinutes(55),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[1].Id, Quantity = 1, UnitPrice = 300, UnitCost = 250 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Ayesha Noor", TotalRevenue = 150, TotalCost = 120,
                OrderStatus = OrderStatus.Delivered, DeliveryAddress = "House 3, Johar Town, Lahore",
                RiderId = asif.Id, ConfirmedAt = now.AddDays(-2), PickedUpAt = now.AddDays(-2).AddMinutes(15),
                OnTheWayAt = now.AddDays(-2).AddMinutes(30), DeliveredAt = now.AddDays(-2).AddMinutes(50),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[0].Id, Quantity = 1, UnitPrice = 150, UnitCost = 120 } }
            },
            new Sale
            {
                StoreId = store.Id, CustomerName = "Nadia Sheikh", TotalRevenue = 640, TotalCost = 510,
                OrderStatus = OrderStatus.Delivered, DeliveryAddress = "House 5, Wapda Town, Lahore",
                RiderId = bilal.Id, ConfirmedAt = now.AddDays(-3), PickedUpAt = now.AddDays(-3).AddMinutes(18),
                OnTheWayAt = now.AddDays(-3).AddMinutes(33), DeliveredAt = now.AddDays(-3).AddMinutes(58),
                Items = new List<SaleItem> { new SaleItem { ItemId = items[9].Id, Quantity = 2, UnitPrice = 330, UnitCost = 280 } }
            },
        };
        db.Sales.AddRange(orders);
        await db.SaveChangesAsync();

        var expenses = new List<Expense>();
        void AddExp(string category, decimal amount, string note, int daysAgo) =>
            expenses.Add(new Expense { StoreId = store.Id, Category = category, Amount = amount, Note = note, Date = now.AddDays(-daysAgo) });

        AddExp("bijli", 4800, "LESCO electricity bill", 2);
        AddExp("bijli", 4600, "LESCO electricity bill", 32);
        AddExp("kiraya", 25000, "Monthly shop rent", 5);
        AddExp("kiraya", 25000, "Monthly shop rent", 35);
        AddExp("tankhwa", 8000, "Weekly wages", 3);
        AddExp("tankhwa", 8000, "Weekly wages", 10);
        AddExp("tankhwa", 8000, "Weekly wages", 17);
        AddExp("thailay", 650, "Plastic shopping bags", 1);
        AddExp("thailay", 500, "Paper bags", 20);
        AddExp("chai", 400, "Daily chai pani", 1);
        AddExp("chai", 350, "Daily chai pani", 8);
        AddExp("phone", 1200, "PTCL/mobile bill", 4);
        AddExp("marmmat", 3500, "Fridge repair", 15);
        AddExp("transport", 2000, "Delivery bike fuel", 6);
        AddExp("transport", 1800, "Delivery bike fuel", 25);
        AddExp("packing", 900, "Cartons and tape", 12);
        AddExp("safai", 600, "Cleaning supplies", 9);
        AddExp("tax", 5000, "Quarterly shop tax", 40);
        AddExp("aur", 750, "Misc shop supplies", 18);

        db.Expenses.AddRange(expenses);
        await db.SaveChangesAsync();
    }
}
