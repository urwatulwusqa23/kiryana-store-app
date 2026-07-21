using KiryanaStore.Application.DTOs;

namespace KiryanaStore.Application.Interfaces;

public interface ISaleService
{
    Task<IEnumerable<SaleDto>> GetAllAsync(int page = 1, int pageSize = 100);
    Task<SaleDto?> GetByIdAsync(int id);
    Task<SaleDto> CreateAsync(CreateSaleDto dto);
    Task<DashboardDto> GetDashboardAsync();
}
