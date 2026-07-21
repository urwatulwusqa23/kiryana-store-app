using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KiryanaStore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_StoreId",
                table: "Suppliers",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_StoreId",
                table: "Sales",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_StoreId_OrderStatus",
                table: "Sales",
                columns: new[] { "StoreId", "OrderStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_StoreId_SaleDate",
                table: "Sales",
                columns: new[] { "StoreId", "SaleDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_StoreId",
                table: "Purchases",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_StoreId",
                table: "Items",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_StoreId",
                table: "Expenses",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_StoreId_Date",
                table: "Expenses",
                columns: new[] { "StoreId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_StoreId",
                table: "Customers",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_StoreId",
                table: "CreditTransactions",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_StoreId_CustomerId",
                table: "CreditTransactions",
                columns: new[] { "StoreId", "CustomerId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Suppliers_StoreId",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_Sales_StoreId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_StoreId_OrderStatus",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_StoreId_SaleDate",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Purchases_StoreId",
                table: "Purchases");

            migrationBuilder.DropIndex(
                name: "IX_Items_StoreId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_StoreId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_StoreId_Date",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Customers_StoreId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_CreditTransactions_StoreId",
                table: "CreditTransactions");

            migrationBuilder.DropIndex(
                name: "IX_CreditTransactions_StoreId_CustomerId",
                table: "CreditTransactions");
        }
    }
}
