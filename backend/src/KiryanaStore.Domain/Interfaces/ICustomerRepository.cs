using KiryanaStore.Domain.Entities;

namespace KiryanaStore.Domain.Interfaces;

public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetWithTransactionsAsync(int id);
    Task<decimal> GetBalanceAsync(int customerId);
    Task<decimal> GetTotalBalanceAsync();
    Task<IEnumerable<Customer>> GetPagedAsync(int page, int pageSize);
    Task<Dictionary<int, decimal>> GetBalancesAsync(IEnumerable<int> customerIds);
}
