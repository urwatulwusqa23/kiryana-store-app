using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record ExpenseDto(int Id, string Category, decimal Amount, string? Note, DateTime Date, DateTime CreatedAt);

public record CreateExpenseDto(
    [property: Required] string Category,
    [property: Range(0.01, double.MaxValue)] decimal Amount,
    string? Note,
    DateTime Date);

public record UpdateExpenseDto(
    [property: Required] string Category,
    [property: Range(0.01, double.MaxValue)] decimal Amount,
    string? Note,
    DateTime Date);
