using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class PurchaseService(IPurchaseRepository purchaseRepo, IItemRepository itemRepo, ICurrentUserContext currentUser) : IPurchaseService
{
    public async Task<IEnumerable<PurchaseDto>> GetAllAsync()
    {
        var purchases = await purchaseRepo.GetAllWithItemsAsync();
        return purchases.Select(MapToDto);
    }

    public async Task<PurchaseDto?> GetByIdAsync(int id)
    {
        var p = await purchaseRepo.GetWithItemsAsync(id);
        return p is null ? null : MapToDto(p);
    }

    public async Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto)
    {
        if (dto.SupplierId < 1) throw new InvalidOperationException("Invalid supplier");
        if (dto.Notes is { Length: > 500 }) throw new InvalidOperationException("Notes must be at most 500 characters");
        var items = dto.Items?.ToList() ?? [];
        if (items.Count < 1) throw new InvalidOperationException("At least one item is required");
        if (items.Any(i => i.ItemId < 1 || i.Quantity < 1 || i.UnitCost < 0))
            throw new InvalidOperationException("Invalid item, quantity, or unit cost");

        var purchase = new Purchase
        {
            StoreId = currentUser.StoreId,
            SupplierId = dto.SupplierId,
            Notes = dto.Notes,
            TotalCost = items.Sum(i => i.Quantity * i.UnitCost),
            Items = items.Select(i => new PurchaseItem
            {
                ItemId = i.ItemId, Quantity = i.Quantity, UnitCost = i.UnitCost
            }).ToList()
        };
        var created = await purchaseRepo.AddAsync(purchase);

        foreach (var item in items)
            await itemRepo.UpdateStockAsync(item.ItemId, item.Quantity);

        var full = await purchaseRepo.GetWithItemsAsync(created.Id);
        return MapToDto(full!);
    }

    public async Task<IEnumerable<PurchaseDto>> GetBySupplierAsync(int supplierId)
    {
        var purchases = await purchaseRepo.GetBySupplierAsync(supplierId);
        return purchases.Select(MapToDto);
    }

    private static PurchaseDto MapToDto(Purchase p) => new(
        p.Id, p.SupplierId, p.Supplier?.Name ?? "",
        p.PurchaseDate, p.TotalCost, p.Notes,
        p.Items.Select(i => new PurchaseItemDto(i.ItemId, i.Item?.Name ?? "", i.Quantity, i.UnitCost))
    );
}
