using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.Application.Services;

public class SaleService(ISaleRepository saleRepo, IItemRepository itemRepo, ICustomerRepository customerRepo) : ISaleService
{
    public async Task<IEnumerable<SaleDto>> GetAllAsync()
    {
        var sales = await saleRepo.GetAllAsync();
        var result = new List<SaleDto>();
        foreach (var s in sales)
        {
            var full = await saleRepo.GetWithItemsAsync(s.Id);
            if (full is not null) result.Add(MapToDto(full));
        }
        return result;
    }

    public async Task<SaleDto?> GetByIdAsync(int id)
    {
        var sale = await saleRepo.GetWithItemsAsync(id);
        return sale is null ? null : MapToDto(sale);
    }

    public async Task<SaleDto> CreateAsync(CreateSaleDto dto)
    {
        var saleItems = new List<SaleItem>();
        decimal totalRevenue = 0, totalCost = 0;

        foreach (var cartItem in dto.Items)
        {
            var item = await itemRepo.GetByIdAsync(cartItem.ItemId)
                ?? throw new InvalidOperationException($"Item {cartItem.ItemId} not found");
            if (item.Quantity < cartItem.Quantity)
                throw new InvalidOperationException($"Insufficient stock for {item.Name}");

            saleItems.Add(new SaleItem
            {
                ItemId = item.Id, Quantity = cartItem.Quantity,
                UnitPrice = item.SellingPrice, UnitCost = item.CostPrice
            });
            totalRevenue += item.SellingPrice * cartItem.Quantity;
            totalCost += item.CostPrice * cartItem.Quantity;
        }

        var sale = new Sale
        {
            CustomerName = dto.CustomerName,
            TotalRevenue = totalRevenue,
            TotalCost = totalCost,
            Items = saleItems
        };
        var created = await saleRepo.AddAsync(sale);

        foreach (var cartItem in dto.Items)
            await itemRepo.UpdateStockAsync(cartItem.ItemId, -cartItem.Quantity);

        var full = await saleRepo.GetWithItemsAsync(created.Id);
        return MapToDto(full!);
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        // timestamptz parameters must be UTC; new DateTime(y,m,1) is Unspecified and breaks Npgsql.
        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todaySales = await saleRepo.GetSalesByDateRangeAsync(todayStart, now);
        var monthSales = await saleRepo.GetSalesByDateRangeAsync(monthStart, now);
        var allSales = await saleRepo.GetAllAsync();
        var recentSales = allSales.OrderByDescending(s => s.SaleDate).Take(5).ToList();
        var recentFull = new List<SaleDto>();
        foreach (var s in recentSales)
        {
            var full = await saleRepo.GetWithItemsAsync(s.Id);
            if (full is not null) recentFull.Add(MapToDto(full));
        }

        var customers = await customerRepo.GetAllAsync();
        decimal totalUdhaar = 0;
        foreach (var c in customers)
            totalUdhaar += await customerRepo.GetBalanceAsync(c.Id);

        var lowStockItems = await itemRepo.GetLowStockItemsAsync();
        var allItems = await itemRepo.GetAllAsync();

        return new DashboardDto(
            todaySales.Sum(s => s.TotalRevenue), todaySales.Sum(s => s.TotalCost),
            todaySales.Sum(s => s.TotalRevenue - s.TotalCost),
            monthSales.Sum(s => s.TotalRevenue), monthSales.Sum(s => s.TotalCost),
            monthSales.Sum(s => s.TotalRevenue - s.TotalCost),
            customers.Count(), totalUdhaar,
            lowStockItems.Count(), allItems.Count(),
            lowStockItems.Select(i => new ItemDto(i.Id, i.Name, i.Unit, i.CostPrice, i.SellingPrice,
                i.Quantity, i.LowStockThreshold, true, i.CreatedAt)),
            recentFull
        );
    }

    private static SaleDto MapToDto(Sale s) => new(
        s.Id, s.SaleDate, s.TotalRevenue, s.TotalCost, s.TotalRevenue - s.TotalCost,
        s.CustomerName,
        s.Items.Select(i => new SaleItemDto(i.ItemId, i.Item?.Name ?? "", i.Quantity, i.UnitPrice, i.UnitCost))
    );
}
