using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class ItemService(IItemRepository itemRepo) : IItemService
{
    public async Task<IEnumerable<ItemDto>> GetAllAsync()
    {
        var items = await itemRepo.GetAllAsync();
        return items.Select(MapToDto);
    }

    public async Task<ItemDto?> GetByIdAsync(int id)
    {
        var item = await itemRepo.GetByIdAsync(id);
        return item is null ? null : MapToDto(item);
    }

    public async Task<ItemDto> CreateAsync(CreateItemDto dto)
    {
        var entity = new Item
        {
            Name = dto.Name, Unit = dto.Unit, CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice, Quantity = dto.Quantity,
            LowStockThreshold = dto.LowStockThreshold
        };
        var created = await itemRepo.AddAsync(entity);
        return MapToDto(created);
    }

    public async Task<ItemDto?> UpdateAsync(int id, UpdateItemDto dto)
    {
        var entity = await itemRepo.GetByIdAsync(id);
        if (entity is null) return null;
        entity.Name = dto.Name; entity.Unit = dto.Unit;
        entity.CostPrice = dto.CostPrice; entity.SellingPrice = dto.SellingPrice;
        entity.Quantity = dto.Quantity; entity.LowStockThreshold = dto.LowStockThreshold;
        var updated = await itemRepo.UpdateAsync(entity);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await itemRepo.GetByIdAsync(id);
        if (entity is null) return false;
        await itemRepo.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<ItemDto>> GetLowStockAsync()
    {
        var items = await itemRepo.GetLowStockItemsAsync();
        return items.Select(MapToDto);
    }

    private static ItemDto MapToDto(Item i) =>
        new(i.Id, i.Name, i.Unit, i.CostPrice, i.SellingPrice, i.Quantity,
            i.LowStockThreshold, i.Quantity <= i.LowStockThreshold, i.CreatedAt);
}
