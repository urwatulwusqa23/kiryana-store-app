using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record ExpenseDto(int Id, string Category, decimal Amount, string? Note, DateTime Date, DateTime CreatedAt);

public record CreateExpenseDto(
    string Category,
    decimal Amount,
    string? Note,
    DateTime Date);

public record UpdateExpenseDto(
    string Category,
    decimal Amount,
    string? Note,
    DateTime Date);
