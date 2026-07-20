using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record SaleItemDto(int ItemId, string ItemName, int Quantity, decimal UnitPrice, decimal UnitCost);

public record SaleDto(
    int Id, DateTime SaleDate, decimal TotalRevenue, decimal TotalCost, decimal Profit, string CustomerName,
    IEnumerable<SaleItemDto> Items,
    string OrderStatus = "None", string? DeliveryAddress = null, string? CustomerRef = null,
    int? RiderId = null, string? RiderName = null,
    DateTime? ConfirmedAt = null, DateTime? PickedUpAt = null, DateTime? OnTheWayAt = null, DateTime? DeliveredAt = null
);

public record CreateOrderDto(
    string CustomerName,
    [property: Required, MinLength(1)] string DeliveryAddress,
    string? CustomerRef,
    [property: Required, MinLength(1)] IEnumerable<CreateSaleItemDto> Items);

public record ConfirmOrderDto([property: Range(1, int.MaxValue)] int RiderId);

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
