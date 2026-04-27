using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class SaleRepository(AppDbContext db) : GenericRepository<Sale>(db), ISaleRepository
{
    public async Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime from, DateTime to) =>
        await _db.Sales.Where(s => s.SaleDate >= from && s.SaleDate <= to).ToListAsync();

    public async Task<Sale?> GetWithItemsAsync(int id) =>
        await _db.Sales.Include(s => s.Items).ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(s => s.Id == id);
}
