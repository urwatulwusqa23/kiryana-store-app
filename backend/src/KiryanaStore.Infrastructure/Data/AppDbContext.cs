using KiryanaStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
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
