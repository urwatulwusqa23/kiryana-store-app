using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class ExpenseService(IRepository<Expense> expenseRepo, ICurrentUserContext currentUser) : IExpenseService
{
    public async Task<IEnumerable<ExpenseDto>> GetAllAsync(DateTime? from, DateTime? to)
    {
        var all = (await expenseRepo.GetAllAsync()).AsEnumerable();
        if (from.HasValue) all = all.Where(e => e.Date >= from.Value);
        if (to.HasValue) all = all.Where(e => e.Date <= to.Value);
        return all.OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt).Select(MapToDto);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseDto dto)
    {
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

    private static ExpenseDto MapToDto(Expense e) => new(e.Id, e.Category, e.Amount, e.Note, e.Date, e.CreatedAt);
}
