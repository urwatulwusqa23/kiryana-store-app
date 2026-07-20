using KiryanaStore.Application.DTOs;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.API.Controllers;

// "Orders" are Sale rows with OrderStatus != None. This controller handles the delivery
// workflow on top of the existing Sale entity, plus the two customer/rider-portal entry
// points that run without a login (this demo has no real customer/rider auth yet).
[ApiController]
[Route("api/[controller]")]
public class OrdersController(AppDbContext db, ICurrentUserContext currentUser) : ControllerBase
{
    [Authorize(Roles = "Owner,Employee,Rider")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var query = db.Sales.Include(s => s.Items).ThenInclude(i => i.Item)
            .Where(s => s.OrderStatus != OrderStatus.None);

        if (currentUser.Role == "Rider")
            query = query.Where(s => s.RiderId == currentUser.UserId
                || (s.RiderId == null && s.OrderStatus == OrderStatus.Pending));

        var orders = await query.OrderByDescending(s => s.SaleDate).ToListAsync();
        var riderNames = await GetRiderNamesAsync(orders);
        return Ok(orders.Select(o => ToDto(o, riderNames)));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpGet("riders")]
    public async Task<IActionResult> GetRiders() =>
        Ok(await db.Users.Where(u => u.Role == UserRole.Rider && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new { u.Id, u.FullName, u.Phone })
            .ToListAsync());

    // Customer Portal has no login — orders are placed against the single demo store.
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Place(CreateOrderDto dto)
    {
        var store = await db.Stores.IgnoreQueryFilters().FirstOrDefaultAsync();
        if (store is null) return BadRequest(new { error = "Store not found" });

        var saleItems = new List<SaleItem>();
        decimal totalRevenue = 0, totalCost = 0;

        foreach (var cartItem in dto.Items)
        {
            var item = await db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == cartItem.ItemId && i.StoreId == store.Id);
            if (item is null) return BadRequest(new { error = $"Item {cartItem.ItemId} not found" });
            if (item.Quantity < cartItem.Quantity)
                return BadRequest(new { error = $"Insufficient stock for {item.Name}" });

            saleItems.Add(new SaleItem { ItemId = item.Id, Quantity = cartItem.Quantity, UnitPrice = item.SellingPrice, UnitCost = item.CostPrice });
            totalRevenue += item.SellingPrice * cartItem.Quantity;
            totalCost += item.CostPrice * cartItem.Quantity;
            item.Quantity -= cartItem.Quantity;
        }

        var sale = new Sale
        {
            StoreId = store.Id,
            CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Online Customer" : dto.CustomerName,
            TotalRevenue = totalRevenue,
            TotalCost = totalCost,
            Items = saleItems,
            OrderStatus = OrderStatus.Pending,
            DeliveryAddress = dto.DeliveryAddress,
            CustomerRef = dto.CustomerRef
        };
        db.Sales.Add(sale);
        await db.SaveChangesAsync();

        var full = await db.Sales.IgnoreQueryFilters().Include(s => s.Items).ThenInclude(i => i.Item)
            .FirstAsync(s => s.Id == sale.Id);
        return Ok(ToDto(full, new Dictionary<int, string>()));
    }

    [AllowAnonymous]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine([FromQuery] string? customerRef)
    {
        if (string.IsNullOrWhiteSpace(customerRef)) return Ok(Array.Empty<object>());

        var orders = await db.Sales.IgnoreQueryFilters()
            .Include(s => s.Items).ThenInclude(i => i.Item)
            .Where(s => s.CustomerRef == customerRef && s.OrderStatus != OrderStatus.None)
            .OrderByDescending(s => s.SaleDate)
            .ToListAsync();
        var riderNames = await GetRiderNamesAsync(orders);
        return Ok(orders.Select(o => ToDto(o, riderNames)));
    }

    [Authorize(Roles = "Owner,Employee")]
    [HttpPut("{id}/confirm")]
    public async Task<IActionResult> Confirm(int id, ConfirmOrderDto dto)
    {
        var sale = await db.Sales.Include(s => s.Items).ThenInclude(i => i.Item).FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null || sale.OrderStatus != OrderStatus.Pending) return NotFound();

        var rider = await db.Users.FirstOrDefaultAsync(u => u.Id == dto.RiderId && u.Role == UserRole.Rider);
        if (rider is null) return BadRequest(new { error = "Rider not found" });

        sale.RiderId = rider.Id;
        sale.OrderStatus = OrderStatus.Confirmed;
        sale.ConfirmedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(ToDto(sale, new Dictionary<int, string> { [rider.Id] = rider.FullName }));
    }

    [Authorize(Roles = "Owner,Employee,Rider")]
    [HttpPut("{id}/advance")]
    public async Task<IActionResult> Advance(int id)
    {
        var sale = await db.Sales.Include(s => s.Items).ThenInclude(i => i.Item).FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();
        if (currentUser.Role == "Rider" && sale.RiderId != currentUser.UserId) return Forbid();

        OrderStatus? next = sale.OrderStatus switch
        {
            OrderStatus.Confirmed => OrderStatus.PickedUp,
            OrderStatus.PickedUp => OrderStatus.OnTheWay,
            OrderStatus.OnTheWay => OrderStatus.Delivered,
            _ => null
        };
        if (next is null) return BadRequest(new { error = "Order cannot be advanced further" });

        var now = DateTime.UtcNow;
        sale.OrderStatus = next.Value;
        if (next == OrderStatus.PickedUp) sale.PickedUpAt = now;
        else if (next == OrderStatus.OnTheWay) sale.OnTheWayAt = now;
        else if (next == OrderStatus.Delivered) sale.DeliveredAt = now;
        await db.SaveChangesAsync();

        var riderNames = await GetRiderNamesAsync([sale]);
        return Ok(ToDto(sale, riderNames));
    }

    private async Task<Dictionary<int, string>> GetRiderNamesAsync(IEnumerable<Sale> sales)
    {
        var riderIds = sales.Where(s => s.RiderId.HasValue).Select(s => s.RiderId!.Value).Distinct().ToList();
        if (riderIds.Count == 0) return new Dictionary<int, string>();
        return await db.Users.IgnoreQueryFilters().Where(u => riderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
    }

    private static SaleDto ToDto(Sale s, Dictionary<int, string> riderNames) => new(
        s.Id, s.SaleDate, s.TotalRevenue, s.TotalCost, s.TotalRevenue - s.TotalCost, s.CustomerName,
        s.Items.Select(i => new SaleItemDto(i.ItemId, i.Item?.Name ?? "", i.Quantity, i.UnitPrice, i.UnitCost)),
        s.OrderStatus.ToString(), s.DeliveryAddress, s.CustomerRef,
        s.RiderId, s.RiderId.HasValue ? riderNames.GetValueOrDefault(s.RiderId.Value) : null,
        s.ConfirmedAt, s.PickedUpAt, s.OnTheWayAt, s.DeliveredAt
    );
}
