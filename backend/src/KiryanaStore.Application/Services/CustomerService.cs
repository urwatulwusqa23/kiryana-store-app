using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class CustomerService(ICustomerRepository customerRepo, IRepository<CreditTransaction> txRepo, ICurrentUserContext currentUser) : ICustomerService
{
    public async Task<IEnumerable<CustomerDto>> GetAllAsync(int page = 1, int pageSize = 100)
    {
        page = page < 1 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var customers = (await customerRepo.GetPagedAsync(page, pageSize)).ToList();
        var balances = await customerRepo.GetBalancesAsync(customers.Select(c => c.Id));
        return customers.Select(c => MapToDto(c, balances.GetValueOrDefault(c.Id)));
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
        ValidateCustomer(dto.Name, dto.Phone, dto.Address, dto.CreditLimit);

        var entity = new Customer
        {
            StoreId = currentUser.StoreId,
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
        ValidateCustomer(dto.Name, dto.Phone, dto.Address, dto.CreditLimit);

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
        if (dto.CustomerId < 1) throw new InvalidOperationException("Invalid customer");
        if (dto.Amount < 0.01m) throw new InvalidOperationException("Amount must be greater than 0");
        if (!string.Equals(dto.Type, "Credit", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(dto.Type, "Payment", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Type must be 'Credit' or 'Payment'");
        if (dto.Note is { Length: > 500 }) throw new InvalidOperationException("Note must be at most 500 characters");

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
            StoreId = currentUser.StoreId,
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

    private static void ValidateCustomer(string name, string phone, string address, decimal? creditLimit)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
            throw new InvalidOperationException("Name is required and must be at most 200 characters");
        if (string.IsNullOrWhiteSpace(phone) || phone.Length > 20)
            throw new InvalidOperationException("Phone is required and must be at most 20 characters");
        if (address is { Length: > 300 })
            throw new InvalidOperationException("Address must be at most 300 characters");
        if (creditLimit is < 0)
            throw new InvalidOperationException("Credit limit cannot be negative");
    }

    private static CustomerDto MapToDto(Customer c, decimal balance) =>
        new(c.Id, c.Name, c.Phone, c.Address, balance, c.CreditLimit, c.CreatedAt);

    private static CreditTransactionDto MapTx(CreditTransaction tx) =>
        new(tx.Id, tx.CustomerId, tx.Customer?.Name ?? "", tx.Amount, tx.Type.ToString(), tx.Note, tx.CreatedAt);

    private static CreditTransactionDto MapTx(CreditTransaction tx, string customerName) =>
        new(tx.Id, tx.CustomerId, customerName, tx.Amount, tx.Type.ToString(), tx.Note, tx.CreatedAt);
}
