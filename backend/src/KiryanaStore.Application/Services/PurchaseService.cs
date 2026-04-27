using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class PurchaseService(IPurchaseRepository purchaseRepo, IItemRepository itemRepo) : IPurchaseService
{
    public async Task<IEnumerable<PurchaseDto>> GetAllAsync()
    {
        var purchases = await purchaseRepo.GetAllAsync();
        var result = new List<PurchaseDto>();
        foreach (var p in purchases)
        {
            var full = await purchaseRepo.GetWithItemsAsync(p.Id);
            if (full is not null) result.Add(MapToDto(full));
        }
        return result;
    }

    public async Task<PurchaseDto?> GetByIdAsync(int id)
    {
        var p = await purchaseRepo.GetWithItemsAsync(id);
        return p is null ? null : MapToDto(p);
    }

    public async Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto)
    {
        var purchase = new Purchase
        {
            SupplierId = dto.SupplierId,
            Notes = dto.Notes,
            TotalCost = dto.Items.Sum(i => i.Quantity * i.UnitCost),
            Items = dto.Items.Select(i => new PurchaseItem
            {
                ItemId = i.ItemId, Quantity = i.Quantity, UnitCost = i.UnitCost
            }).ToList()
        };
        var created = await purchaseRepo.AddAsync(purchase);

        foreach (var item in dto.Items)
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
