using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class CustomerService(ICustomerRepository customerRepo, IRepository<CreditTransaction> txRepo) : ICustomerService
{
    public async Task<IEnumerable<CustomerDto>> GetAllAsync()
    {
        var customers = await customerRepo.GetAllAsync();
        var result = new List<CustomerDto>();
        foreach (var c in customers)
        {
            var balance = await customerRepo.GetBalanceAsync(c.Id);
            result.Add(MapToDto(c, balance));
        }
        return result;
    }

    public async Task<CustomerWithTransactionsDto?> GetByIdAsync(int id)
    {
        var customer = await customerRepo.GetWithTransactionsAsync(id);
        if (customer is null) return null;
        var balance = await customerRepo.GetBalanceAsync(id);
        var txs = customer.CreditTransactions.Select(MapTx);
        return new CustomerWithTransactionsDto(MapToDto(customer, balance), txs);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        var entity = new Customer
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Address = dto.Address,
            CreditLimit = dto.CreditLimit
        };
        var created = await customerRepo.AddAsync(entity);
        return MapToDto(created, 0);
    }

    public async Task<CustomerDto?> UpdateAsync(int id, UpdateCustomerDto dto)
    {
        var entity = await customerRepo.GetByIdAsync(id);
        if (entity is null) return null;
        entity.Name = dto.Name;
        entity.Phone = dto.Phone;
        entity.Address = dto.Address;
        entity.CreditLimit = dto.CreditLimit;
        var updated = await customerRepo.UpdateAsync(entity);
        var balance = await customerRepo.GetBalanceAsync(id);
        return MapToDto(updated, balance);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await customerRepo.GetByIdAsync(id);
        if (entity is null) return false;
        await customerRepo.DeleteAsync(id);
        return true;
    }

    public async Task<CreditTransactionDto> AddTransactionAsync(CreateCreditDto dto)
    {
        var customer = await customerRepo.GetByIdAsync(dto.CustomerId);
        if (customer is null) throw new InvalidOperationException("Customer not found");

        if (dto.Type.Equals("Credit", StringComparison.OrdinalIgnoreCase) && customer.CreditLimit.HasValue)
        {
            var currentBalance = await customerRepo.GetBalanceAsync(dto.CustomerId);
            if (currentBalance + dto.Amount > customer.CreditLimit.Value)
                throw new InvalidOperationException(
                    $"Credit limit of Rs {customer.CreditLimit.Value:N0} exceeded. " +
                    $"Current balance: Rs {currentBalance:N0}, remaining: Rs {(customer.CreditLimit.Value - currentBalance):N0}");
        }

        var type = Enum.Parse<TransactionType>(dto.Type, true);
        var tx = new CreditTransaction
        {
            CustomerId = dto.CustomerId,
            Amount = dto.Amount,
            Type = type,
            Note = dto.Note
        };
        var created = await txRepo.AddAsync(tx);
        return MapTx(created, customer.Name);
    }

    public async Task<IEnumerable<CreditTransactionDto>> GetTransactionsAsync(int customerId)
    {
        var customer = await customerRepo.GetWithTransactionsAsync(customerId);
        if (customer is null) return [];
        return customer.CreditTransactions.Select(MapTx);
    }

    private static CustomerDto MapToDto(Customer c, decimal balance) =>
        new(c.Id, c.Name, c.Phone, c.Address, balance, c.CreditLimit, c.CreatedAt);

    private static CreditTransactionDto MapTx(CreditTransaction tx) =>
        new(tx.Id, tx.CustomerId, tx.Customer?.Name ?? "", tx.Amount, tx.Type.ToString(), tx.Note, tx.CreatedAt);

    private static CreditTransactionDto MapTx(CreditTransaction tx, string customerName) =>
        new(tx.Id, tx.CustomerId, customerName, tx.Amount, tx.Type.ToString(), tx.Note, tx.CreatedAt);
}
