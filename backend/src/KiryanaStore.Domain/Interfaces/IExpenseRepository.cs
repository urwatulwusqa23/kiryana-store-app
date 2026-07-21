using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface IExpenseRepository : IRepository<Expense>
{
    Task<IEnumerable<Expense>> GetFilteredAsync(DateTime? from, DateTime? to, int page, int pageSize);
}
