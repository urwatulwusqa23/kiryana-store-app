namespace KiryanaStore.Application.DTOs;

public record SaleItemDto(int ItemId, string ItemName, int Quantity, decimal UnitPrice, decimal UnitCost);

public record SaleDto(
    int Id, DateTime SaleDate, decimal TotalRevenue, decimal TotalCost, decimal Profit, string CustomerName,
    IEnumerable<SaleItemDto> Items,
    string OrderStatus = "None", string? DeliveryAddress = null, string? CustomerRef = null,
    int? RiderId = null, string? RiderName = null,
    DateTime? ConfirmedAt = null, DateTime? PickedUpAt = null, DateTime? OnTheWayAt = null, DateTime? DeliveredAt = null
);

// Note: no [Required]/[Range]/[MinLength] attributes here — ASP.NET's DataAnnotations
// metadata provider throws at request time when a record primary-constructor parameter
// carries validation attributes (a known ASP.NET Core incompatibility with positional
// records). Everything below is validated manually in the controllers/services instead.
public record CreateOrderDto(string CustomerName, string DeliveryAddress, List<CreateSaleItemDto> Items);

public record ConfirmOrderDto(int RiderId);

public record CreateSaleItemDto(int ItemId, int Quantity);

public record CreateSaleDto(string CustomerName, List<CreateSaleItemDto> Items);

public record DashboardDto(
    decimal TodayRevenue, decimal TodayCost, decimal TodayProfit,
    decimal MonthRevenue, decimal MonthCost, decimal MonthProfit,
    int TotalCustomers, decimal TotalUdhaar,
    int LowStockCount, int TotalItems,
    IEnumerable<ItemDto> LowStockItems,
    IEnumerable<SaleDto> RecentSales
);
