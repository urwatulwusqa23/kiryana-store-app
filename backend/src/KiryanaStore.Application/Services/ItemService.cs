using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class ItemService(IItemRepository itemRepo, ICurrentUserContext currentUser) : IItemService
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
        ValidateItem(dto.Name, dto.Unit, dto.CostPrice, dto.SellingPrice, dto.Quantity, dto.LowStockThreshold);

        var entity = new Item
        {
            StoreId = currentUser.StoreId,
            Name = dto.Name, Unit = dto.Unit, CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice, Quantity = dto.Quantity,
            LowStockThreshold = dto.LowStockThreshold
        };
        var created = await itemRepo.AddAsync(entity);
        return MapToDto(created);
    }

    public async Task<ItemDto?> UpdateAsync(int id, UpdateItemDto dto)
    {
        ValidateItem(dto.Name, dto.Unit, dto.CostPrice, dto.SellingPrice, dto.Quantity, dto.LowStockThreshold);

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

    private static void ValidateItem(string name, string unit, decimal costPrice, decimal sellingPrice, int quantity, int lowStockThreshold)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
            throw new InvalidOperationException("Name is required and must be at most 200 characters");
        if (string.IsNullOrWhiteSpace(unit) || unit.Length > 50)
            throw new InvalidOperationException("Unit is required and must be at most 50 characters");
        if (costPrice < 0) throw new InvalidOperationException("Cost price cannot be negative");
        if (sellingPrice < 0) throw new InvalidOperationException("Selling price cannot be negative");
        if (quantity < 0) throw new InvalidOperationException("Quantity cannot be negative");
        if (lowStockThreshold < 0) throw new InvalidOperationException("Low stock threshold cannot be negative");
    }

    private static ItemDto MapToDto(Item i) =>
        new(i.Id, i.Name, i.Unit, i.CostPrice, i.SellingPrice, i.Quantity,
            i.LowStockThreshold, i.Quantity <= i.LowStockThreshold, i.CreatedAt);
}
