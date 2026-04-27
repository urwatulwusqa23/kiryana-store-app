using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface IPurchaseService
{
    Task<IEnumerable<PurchaseDto>> GetAllAsync();
    Task<PurchaseDto?> GetByIdAsync(int id);
    Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto);
    Task<IEnumerable<PurchaseDto>> GetBySupplierAsync(int supplierId);
}
