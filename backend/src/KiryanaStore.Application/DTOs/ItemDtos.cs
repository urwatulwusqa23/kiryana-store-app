using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record ItemDto(int Id, string Name, string Unit, decimal CostPrice, decimal SellingPrice, int Quantity, int LowStockThreshold, bool IsLowStock, DateTime CreatedAt);

public record CreateItemDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Required, StringLength(50, MinimumLength = 1)] string Unit,
    [property: Range(0, double.MaxValue)] decimal CostPrice,
    [property: Range(0, double.MaxValue)] decimal SellingPrice,
    [property: Range(0, int.MaxValue)] int Quantity,
    [property: Range(0, int.MaxValue)] int LowStockThreshold);

public record UpdateItemDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Required, StringLength(50, MinimumLength = 1)] string Unit,
    [property: Range(0, double.MaxValue)] decimal CostPrice,
    [property: Range(0, double.MaxValue)] decimal SellingPrice,
    [property: Range(0, int.MaxValue)] int Quantity,
    [property: Range(0, int.MaxValue)] int LowStockThreshold);
