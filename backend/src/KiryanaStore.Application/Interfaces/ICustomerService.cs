using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> GetAllAsync();
    Task<CustomerWithTransactionsDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto);
    Task<CustomerDto?> UpdateAsync(int id, UpdateCustomerDto dto);
    Task<bool> DeleteAsync(int id);
    Task<CreditTransactionDto> AddTransactionAsync(CreateCreditDto dto);
    Task<IEnumerable<CreditTransactionDto>> GetTransactionsAsync(int customerId);
}
