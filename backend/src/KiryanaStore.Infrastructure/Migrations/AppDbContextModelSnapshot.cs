using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable
namespace KiryanaStore.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0")
                        .HasAnnotation("Relational:MaxIdentifierLength", 128);
            modelBuilder.UseIdentityColumns();

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Customer", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<string>("Name").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Phone").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Address").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<decimal?>("CreditLimit").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<DateTime>("CreatedAt").HasColumnType("datetime2");
                b.HasKey("Id");
                b.ToTable("Customers");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.CreditTransaction", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<int>("CustomerId").HasColumnType("int");
                b.Property<decimal>("Amount").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<string>("Type").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Note").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<DateTime>("CreatedAt").HasColumnType("datetime2");
                b.HasKey("Id");
                b.HasIndex("CustomerId");
                b.ToTable("CreditTransactions");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Item", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<string>("Name").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Unit").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<decimal>("CostPrice").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<decimal>("SellingPrice").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<int>("Quantity").HasColumnType("int");
                b.Property<int>("LowStockThreshold").HasColumnType("int");
                b.Property<DateTime>("CreatedAt").HasColumnType("datetime2");
                b.HasKey("Id");
                b.ToTable("Items");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Supplier", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<string>("Name").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Phone").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<string>("Company").IsRequired().HasColumnType("nvarchar(max)");
                b.Property<DateTime>("CreatedAt").HasColumnType("datetime2");
                b.HasKey("Id");
                b.ToTable("Suppliers");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Purchase", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<int>("SupplierId").HasColumnType("int");
                b.Property<DateTime>("PurchaseDate").HasColumnType("datetime2");
                b.Property<decimal>("TotalCost").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<string>("Notes").IsRequired().HasColumnType("nvarchar(max)");
                b.HasKey("Id");
                b.HasIndex("SupplierId");
                b.ToTable("Purchases");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.PurchaseItem", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<int>("PurchaseId").HasColumnType("int");
                b.Property<int>("ItemId").HasColumnType("int");
                b.Property<int>("Quantity").HasColumnType("int");
                b.Property<decimal>("UnitCost").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.HasKey("Id");
                b.HasIndex("PurchaseId");
                b.HasIndex("ItemId");
                b.ToTable("PurchaseItems");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Sale", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<DateTime>("SaleDate").HasColumnType("datetime2");
                b.Property<decimal>("TotalRevenue").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<decimal>("TotalCost").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<string>("CustomerName").IsRequired().HasColumnType("nvarchar(max)");
                b.HasKey("Id");
                b.ToTable("Sales");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.SaleItem", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int").UseIdentityColumn();
                b.Property<int>("SaleId").HasColumnType("int");
                b.Property<int>("ItemId").HasColumnType("int");
                b.Property<int>("Quantity").HasColumnType("int");
                b.Property<decimal>("UnitPrice").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.Property<decimal>("UnitCost").HasPrecision(18, 2).HasColumnType("decimal(18,2)");
                b.HasKey("Id");
                b.HasIndex("SaleId");
                b.HasIndex("ItemId");
                b.ToTable("SaleItems");
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.CreditTransaction", b =>
            {
                b.HasOne("KiryanaStore.Domain.Entities.Customer", "Customer")
                    .WithMany("CreditTransactions").HasForeignKey("CustomerId")
                    .OnDelete(DeleteBehavior.Cascade).IsRequired();
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.Purchase", b =>
            {
                b.HasOne("KiryanaStore.Domain.Entities.Supplier", "Supplier")
                    .WithMany("Purchases").HasForeignKey("SupplierId")
                    .OnDelete(DeleteBehavior.Cascade).IsRequired();
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.PurchaseItem", b =>
            {
                b.HasOne("KiryanaStore.Domain.Entities.Purchase", "Purchase")
                    .WithMany("Items").HasForeignKey("PurchaseId")
                    .OnDelete(DeleteBehavior.Cascade).IsRequired();
                b.HasOne("KiryanaStore.Domain.Entities.Item", "Item")
                    .WithMany("PurchaseItems").HasForeignKey("ItemId")
                    .OnDelete(DeleteBehavior.Restrict).IsRequired();
            });

            modelBuilder.Entity("KiryanaStore.Domain.Entities.SaleItem", b =>
            {
                b.HasOne("KiryanaStore.Domain.Entities.Sale", "Sale")
                    .WithMany("Items").HasForeignKey("SaleId")
                    .OnDelete(DeleteBehavior.Cascade).IsRequired();
                b.HasOne("KiryanaStore.Domain.Entities.Item", "Item")
                    .WithMany("SaleItems").HasForeignKey("ItemId")
                    .OnDelete(DeleteBehavior.Restrict).IsRequired();
            });
#pragma warning restore 612, 618
        }
    }
}
