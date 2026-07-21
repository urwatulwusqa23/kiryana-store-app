using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class ExpenseRepository(AppDbContext db) : GenericRepository<Expense>(db), IExpenseRepository
{
    public async Task<IEnumerable<Expense>> GetFilteredAsync(DateTime? from, DateTime? to, int page, int pageSize)
    {
        var query = _db.Expenses.AsQueryable();
        if (from.HasValue) query = query.Where(e => e.Date >= from.Value);
        if (to.HasValue) query = query.Where(e => e.Date <= to.Value);

        return await query.OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
    }
}
