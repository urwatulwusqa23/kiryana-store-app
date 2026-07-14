using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record PurchaseItemDto(int ItemId, string ItemName, int Quantity, decimal UnitCost);

public record PurchaseDto(int Id, int SupplierId, string SupplierName, DateTime PurchaseDate, decimal TotalCost, string Notes, IEnumerable<PurchaseItemDto> Items);

public record CreatePurchaseItemDto(
    [property: Range(1, int.MaxValue)] int ItemId,
    [property: Range(1, int.MaxValue)] int Quantity,
    [property: Range(0, double.MaxValue)] decimal UnitCost);

public record CreatePurchaseDto(
    [property: Range(1, int.MaxValue)] int SupplierId,
    [property: StringLength(500)] string Notes,
    [property: Required, MinLength(1)] IEnumerable<CreatePurchaseItemDto> Items);
