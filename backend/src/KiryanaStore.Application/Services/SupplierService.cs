using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class SupplierService(IRepository<Supplier> supplierRepo, ICurrentUserContext currentUser) : ISupplierService
{
    public async Task<IEnumerable<SupplierDto>> GetAllAsync()
    {
        var suppliers = await supplierRepo.GetAllAsync();
        return suppliers.Select(MapToDto);
    }

    public async Task<SupplierDto?> GetByIdAsync(int id)
    {
        var s = await supplierRepo.GetByIdAsync(id);
        return s is null ? null : MapToDto(s);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierDto dto)
    {
        ValidateSupplier(dto.Name, dto.Phone, dto.Company);

        var entity = new Supplier { StoreId = currentUser.StoreId, Name = dto.Name, Phone = dto.Phone, Company = dto.Company };
        var created = await supplierRepo.AddAsync(entity);
        return MapToDto(created);
    }

    public async Task<SupplierDto?> UpdateAsync(int id, UpdateSupplierDto dto)
    {
        ValidateSupplier(dto.Name, dto.Phone, dto.Company);

        var entity = await supplierRepo.GetByIdAsync(id);
        if (entity is null) return null;
        entity.Name = dto.Name; entity.Phone = dto.Phone; entity.Company = dto.Company;
        var updated = await supplierRepo.UpdateAsync(entity);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await supplierRepo.GetByIdAsync(id);
        if (entity is null) return false;
        await supplierRepo.DeleteAsync(id);
        return true;
    }

    private static void ValidateSupplier(string name, string phone, string company)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
            throw new InvalidOperationException("Name is required and must be at most 200 characters");
        if (phone is { Length: > 20 })
            throw new InvalidOperationException("Phone must be at most 20 characters");
        if (company is { Length: > 200 })
            throw new InvalidOperationException("Company must be at most 200 characters");
    }

    private static SupplierDto MapToDto(Supplier s) =>
        new(s.Id, s.Name, s.Phone, s.Company, s.CreatedAt);
}
