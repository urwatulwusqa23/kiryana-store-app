using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface IItemRepository : IRepository<Item>
{
    Task<IEnumerable<Item>> GetLowStockItemsAsync();
    Task UpdateStockAsync(int itemId, int quantityChange);
}
