using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class ItemRepository(AppDbContext db) : GenericRepository<Item>(db), IItemRepository
{
    public async Task<IEnumerable<Item>> GetLowStockItemsAsync() =>
        await _db.Items.Where(i => i.Quantity <= i.LowStockThreshold).ToListAsync();

    public async Task UpdateStockAsync(int itemId, int quantityChange)
    {
        var item = await _db.Items.FindAsync(itemId);
        if (item is not null)
        {
            item.Quantity += quantityChange;
            await _db.SaveChangesAsync();
        }
    }
}
