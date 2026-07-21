using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class CustomerRepository(AppDbContext db) : GenericRepository<Customer>(db), ICustomerRepository
{
    public async Task<Customer?> GetWithTransactionsAsync(int id) =>
        await _db.Customers.Include(c => c.CreditTransactions).FirstOrDefaultAsync(c => c.Id == id);

    public async Task<decimal> GetBalanceAsync(int customerId) =>
        await _db.CreditTransactions.Where(t => t.CustomerId == customerId)
            .SumAsync(t => t.Type == TransactionType.Credit ? t.Amount : -t.Amount);

    public async Task<decimal> GetTotalBalanceAsync() =>
        await _db.CreditTransactions.SumAsync(t => t.Type == TransactionType.Credit ? t.Amount : -t.Amount);

    public async Task<IEnumerable<Customer>> GetPagedAsync(int page, int pageSize) =>
        await _db.Customers.OrderBy(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

    // Single grouped SQL aggregate instead of one balance query per customer.
    public async Task<Dictionary<int, decimal>> GetBalancesAsync(IEnumerable<int> customerIds)
    {
        var ids = customerIds.ToList();
        if (ids.Count == 0) return new Dictionary<int, decimal>();

        return await _db.CreditTransactions.Where(t => ids.Contains(t.CustomerId))
            .GroupBy(t => t.CustomerId)
            .Select(g => new { CustomerId = g.Key, Balance = g.Sum(t => t.Type == TransactionType.Credit ? t.Amount : -t.Amount) })
            .ToDictionaryAsync(x => x.CustomerId, x => x.Balance);
    }
}
