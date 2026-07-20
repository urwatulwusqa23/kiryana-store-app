using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserContext currentUser) : DbContext(options)
{
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<User> Users => Set<User>();
    public DbSet<CustomerAccount> CustomerAccounts => Set<CustomerAccount>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Tenant isolation: every store-scoped query is automatically filtered to the
        // caller's StoreId (from the JWT via ICurrentUserContext). Auth lookups that must
        // run before a StoreId is known use .IgnoreQueryFilters() explicitly.
        modelBuilder.Entity<Customer>().HasQueryFilter(c => c.StoreId == currentUser.StoreId);
        modelBuilder.Entity<Item>().HasQueryFilter(i => i.StoreId == currentUser.StoreId);
        modelBuilder.Entity<Supplier>().HasQueryFilter(s => s.StoreId == currentUser.StoreId);
        modelBuilder.Entity<Purchase>().HasQueryFilter(p => p.StoreId == currentUser.StoreId);
        modelBuilder.Entity<Sale>().HasQueryFilter(s => s.StoreId == currentUser.StoreId);
        modelBuilder.Entity<CreditTransaction>().HasQueryFilter(t => t.StoreId == currentUser.StoreId);
        modelBuilder.Entity<User>().HasQueryFilter(u => u.StoreId == currentUser.StoreId);
        modelBuilder.Entity<CustomerAccount>().HasQueryFilter(c => c.StoreId == currentUser.StoreId);

        modelBuilder.Entity<CreditTransaction>()
            .Property(t => t.Type)
            .HasConversion<string>();

        modelBuilder.Entity<Sale>()
            .Ignore(s => s.Profit);

        modelBuilder.Entity<Customer>().HasMany(c => c.CreditTransactions)
            .WithOne(t => t.Customer).HasForeignKey(t => t.CustomerId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Purchase>().HasMany(p => p.Items)
            .WithOne(i => i.Purchase).HasForeignKey(i => i.PurchaseId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Sale>().HasMany(s => s.Items)
            .WithOne(i => i.Sale).HasForeignKey(i => i.SaleId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Customer>().Property(c => c.CreditLimit).HasPrecision(18, 2);
        modelBuilder.Entity<Item>().Property(i => i.CostPrice).HasPrecision(18, 2);
        modelBuilder.Entity<Item>().Property(i => i.SellingPrice).HasPrecision(18, 2);
        modelBuilder.Entity<CreditTransaction>().Property(t => t.Amount).HasPrecision(18, 2);
        modelBuilder.Entity<Purchase>().Property(p => p.TotalCost).HasPrecision(18, 2);
        modelBuilder.Entity<PurchaseItem>().Property(p => p.UnitCost).HasPrecision(18, 2);
        modelBuilder.Entity<Sale>().Property(s => s.TotalRevenue).HasPrecision(18, 2);
        modelBuilder.Entity<Sale>().Property(s => s.TotalCost).HasPrecision(18, 2);
        modelBuilder.Entity<SaleItem>().Property(s => s.UnitPrice).HasPrecision(18, 2);
        modelBuilder.Entity<SaleItem>().Property(s => s.UnitCost).HasPrecision(18, 2);
    }
}
