using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface IItemService
{
    Task<IEnumerable<ItemDto>> GetAllAsync();
    Task<ItemDto?> GetByIdAsync(int id);
    Task<ItemDto> CreateAsync(CreateItemDto dto);
    Task<ItemDto?> UpdateAsync(int id, UpdateItemDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<ItemDto>> GetLowStockAsync();
}
