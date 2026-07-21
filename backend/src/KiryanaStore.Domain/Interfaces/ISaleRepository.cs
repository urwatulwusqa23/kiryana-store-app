using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface ISaleRepository : IRepository<Sale>
{
    Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime from, DateTime to);
    Task<Sale?> GetWithItemsAsync(int id);
    Task<IEnumerable<Sale>> GetAllWithItemsAsync(int page = 1, int pageSize = 100);
    Task<IEnumerable<Sale>> GetRecentWithItemsAsync(int count);
}
