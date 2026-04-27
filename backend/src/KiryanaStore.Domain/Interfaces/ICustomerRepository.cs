using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetWithTransactionsAsync(int id);
    Task<decimal> GetBalanceAsync(int customerId);
}
