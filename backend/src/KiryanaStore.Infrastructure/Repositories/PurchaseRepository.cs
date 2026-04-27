using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class PurchaseRepository(AppDbContext db) : GenericRepository<Purchase>(db), IPurchaseRepository
{
    public async Task<Purchase?> GetWithItemsAsync(int id) =>
        await _db.Purchases.Include(p => p.Supplier).Include(p => p.Items).ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<Purchase>> GetBySupplierAsync(int supplierId) =>
        await _db.Purchases.Include(p => p.Supplier).Include(p => p.Items).ThenInclude(i => i.Item)
            .Where(p => p.SupplierId == supplierId).ToListAsync();
}
