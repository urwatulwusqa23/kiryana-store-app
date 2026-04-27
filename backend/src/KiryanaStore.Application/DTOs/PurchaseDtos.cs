namespace KiryanaStore.Application.DTOs;

public record PurchaseItemDto(int ItemId, string ItemName, int Quantity, decimal UnitCost);

public record PurchaseDto(int Id, int SupplierId, string SupplierName, DateTime PurchaseDate, decimal TotalCost, string Notes, IEnumerable<PurchaseItemDto> Items);

public record CreatePurchaseItemDto(int ItemId, int Quantity, decimal UnitCost);

public record CreatePurchaseDto(int SupplierId, string Notes, IEnumerable<CreatePurchaseItemDto> Items);
