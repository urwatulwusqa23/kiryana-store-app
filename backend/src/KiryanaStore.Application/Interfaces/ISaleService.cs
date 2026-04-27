using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface ISaleService
{
    Task<IEnumerable<SaleDto>> GetAllAsync();
    Task<SaleDto?> GetByIdAsync(int id);
    Task<SaleDto> CreateAsync(CreateSaleDto dto);
    Task<DashboardDto> GetDashboardAsync();
}
