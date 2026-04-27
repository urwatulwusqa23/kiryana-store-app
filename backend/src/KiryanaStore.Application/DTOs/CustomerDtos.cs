namespace KiryanaStore.Application.DTOs;

public record CustomerDto(int Id, string Name, string Phone, string Address, decimal Balance, decimal? CreditLimit, DateTime CreatedAt);

public record CreateCustomerDto(string Name, string Phone, string Address, decimal? CreditLimit);

public record UpdateCustomerDto(string Name, string Phone, string Address, decimal? CreditLimit);

public record CreditTransactionDto(int Id, int CustomerId, string CustomerName, decimal Amount, string Type, string Note, DateTime CreatedAt);

public record CreateCreditDto(int CustomerId, decimal Amount, string Type, string Note);

public record CustomerWithTransactionsDto(CustomerDto Customer, IEnumerable<CreditTransactionDto> Transactions);
