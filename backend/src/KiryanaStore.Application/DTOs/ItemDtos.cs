namespace KiryanaStore.Application.DTOs;

public record ItemDto(int Id, string Name, string Unit, decimal CostPrice, decimal SellingPrice, int Quantity, int LowStockThreshold, bool IsLowStock, DateTime CreatedAt);

public record CreateItemDto(string Name, string Unit, decimal CostPrice, decimal SellingPrice, int Quantity, int LowStockThreshold);

public record UpdateItemDto(string Name, string Unit, decimal CostPrice, decimal SellingPrice, int Quantity, int LowStockThreshold);
