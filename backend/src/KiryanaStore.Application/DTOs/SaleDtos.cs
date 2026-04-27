namespace KiryanaStore.Application.DTOs;

public record SaleItemDto(int ItemId, string ItemName, int Quantity, decimal UnitPrice, decimal UnitCost);

public record SaleDto(int Id, DateTime SaleDate, decimal TotalRevenue, decimal TotalCost, decimal Profit, string CustomerName, IEnumerable<SaleItemDto> Items);

public record CreateSaleItemDto(int ItemId, int Quantity);

public record CreateSaleDto(string CustomerName, IEnumerable<CreateSaleItemDto> Items);

public record DashboardDto(
    decimal TodayRevenue, decimal TodayCost, decimal TodayProfit,
    decimal MonthRevenue, decimal MonthCost, decimal MonthProfit,
    int TotalCustomers, decimal TotalUdhaar,
    int LowStockCount, int TotalItems,
    IEnumerable<ItemDto> LowStockItems,
    IEnumerable<SaleDto> RecentSales
);
