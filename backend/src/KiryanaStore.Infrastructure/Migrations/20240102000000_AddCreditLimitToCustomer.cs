using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KiryanaStore.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20240102000000_AddCreditLimitToCustomer")]
    public partial class AddCreditLimitToCustomer : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Customers",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CreditLimit", table: "Customers");
        }
    }
}
