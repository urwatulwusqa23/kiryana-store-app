using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseDto>> GetAllAsync(DateTime? from, DateTime? to);
    Task<ExpenseDto> CreateAsync(CreateExpenseDto dto);
    Task<ExpenseDto?> UpdateAsync(int id, UpdateExpenseDto dto);
    Task<bool> DeleteAsync(int id);
}
