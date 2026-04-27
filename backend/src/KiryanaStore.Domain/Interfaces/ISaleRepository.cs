using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface ISaleRepository : IRepository<Sale>
{
    Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime from, DateTime to);
    Task<Sale?> GetWithItemsAsync(int id);
}
