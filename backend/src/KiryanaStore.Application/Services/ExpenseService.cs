using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class ExpenseService(IExpenseRepository expenseRepo, ICurrentUserContext currentUser) : IExpenseService
{
    public async Task<IEnumerable<ExpenseDto>> GetAllAsync(DateTime? from, DateTime? to, int page = 1, int pageSize = 100)
    {
        page = page < 1 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var filtered = await expenseRepo.GetFilteredAsync(from, to, page, pageSize);
        return filtered.Select(MapToDto);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseDto dto)
    {
        ValidateExpense(dto.Category, dto.Amount);

        var entity = new Expense
        {
            StoreId = currentUser.StoreId,
            Category = dto.Category,
            Amount = dto.Amount,
            Note = dto.Note,
            Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc)
        };
        var created = await expenseRepo.AddAsync(entity);
        return MapToDto(created);
    }

    public async Task<ExpenseDto?> UpdateAsync(int id, UpdateExpenseDto dto)
    {
        ValidateExpense(dto.Category, dto.Amount);

        var entity = await expenseRepo.GetByIdAsync(id);
        if (entity is null) return null;
        entity.Category = dto.Category;
        entity.Amount = dto.Amount;
        entity.Note = dto.Note;
        entity.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        var updated = await expenseRepo.UpdateAsync(entity);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await expenseRepo.GetByIdAsync(id);
        if (entity is null) return false;
        await expenseRepo.DeleteAsync(id);
        return true;
    }

    private static void ValidateExpense(string category, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new InvalidOperationException("Category is required");
        if (amount < 0.01m)
            throw new InvalidOperationException("Amount must be greater than 0");
    }

    private static ExpenseDto MapToDto(Expense e) => new(e.Id, e.Category, e.Amount, e.Note, e.Date, e.CreatedAt);
}
