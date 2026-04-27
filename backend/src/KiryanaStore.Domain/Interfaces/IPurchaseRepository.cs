using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface IPurchaseRepository : IRepository<Purchase>
{
    Task<Purchase?> GetWithItemsAsync(int id);
    Task<IEnumerable<Purchase>> GetBySupplierAsync(int supplierId);
}
