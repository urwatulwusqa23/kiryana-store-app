using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record SaleItemDto(int ItemId, string ItemName, int Quantity, decimal UnitPrice, decimal UnitCost);

public record SaleDto(int Id, DateTime SaleDate, decimal TotalRevenue, decimal TotalCost, decimal Profit, string CustomerName, IEnumerable<SaleItemDto> Items);

public record CreateSaleItemDto(
    [property: Range(1, int.MaxValue)] int ItemId,
    [property: Range(1, int.MaxValue)] int Quantity);

public record CreateSaleDto(
    string CustomerName,
    [property: Required, MinLength(1)] IEnumerable<CreateSaleItemDto> Items);

public record DashboardDto(
    decimal TodayRevenue, decimal TodayCost, decimal TodayProfit,
    decimal MonthRevenue, decimal MonthCost, decimal MonthProfit,
    int TotalCustomers, decimal TotalUdhaar,
    int LowStockCount, int TotalItems,
    IEnumerable<ItemDto> LowStockItems,
    IEnumerable<SaleDto> RecentSales
);
