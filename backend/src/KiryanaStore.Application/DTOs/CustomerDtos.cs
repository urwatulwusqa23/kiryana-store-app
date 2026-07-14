using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record CustomerDto(int Id, string Name, string Phone, string Address, decimal Balance, decimal? CreditLimit, DateTime CreatedAt);

public record CreateCustomerDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Required, Phone, StringLength(20)] string Phone,
    [property: StringLength(300)] string Address,
    [property: Range(0, double.MaxValue)] decimal? CreditLimit);

public record UpdateCustomerDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Required, Phone, StringLength(20)] string Phone,
    [property: StringLength(300)] string Address,
    [property: Range(0, double.MaxValue)] decimal? CreditLimit);

public record CreditTransactionDto(int Id, int CustomerId, string CustomerName, decimal Amount, string Type, string Note, DateTime CreatedAt);

public record CreateCreditDto(
    [property: Range(1, int.MaxValue)] int CustomerId,
    [property: Range(0.01, double.MaxValue)] decimal Amount,
    [property: Required, RegularExpression("^(Credit|Payment)$")] string Type,
    [property: StringLength(500)] string Note);

public record CustomerWithTransactionsDto(CustomerDto Customer, IEnumerable<CreditTransactionDto> Transactions);
