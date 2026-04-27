using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.Infrastructure.Repositories;

public class CustomerRepository(AppDbContext db) : GenericRepository<Customer>(db), ICustomerRepository
{
    public async Task<Customer?> GetWithTransactionsAsync(int id) =>
        await _db.Customers.Include(c => c.CreditTransactions).FirstOrDefaultAsync(c => c.Id == id);

    public async Task<decimal> GetBalanceAsync(int customerId)
    {
        var transactions = await _db.CreditTransactions.Where(t => t.CustomerId == customerId).ToListAsync();
        return transactions.Sum(t => t.Type == TransactionType.Credit ? t.Amount : -t.Amount);
    }
}
