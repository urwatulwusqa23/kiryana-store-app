using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class SupplierService(IRepository<Supplier> supplierRepo) : ISupplierService
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
        var entity = new Supplier { Name = dto.Name, Phone = dto.Phone, Company = dto.Company };
        var created = await supplierRepo.AddAsync(entity);
        return MapToDto(created);
    }

    public async Task<SupplierDto?> UpdateAsync(int id, UpdateSupplierDto dto)
    {
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

    private static SupplierDto MapToDto(Supplier s) =>
        new(s.Id, s.Name, s.Phone, s.Company, s.CreatedAt);
}
