using KiryanaStore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.API.Controllers;

// Public, unauthenticated store discovery for the Customer Portal — no login exists for
// customers yet, so "nearby stores" and "this store's stock" both have to work anonymously.
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class StoresController(AppDbContext db) : ControllerBase
{
    [HttpGet("nearby")]
    public async Task<IActionResult> Nearby([FromQuery] double? lat, [FromQuery] double? lng)
    {
        var stores = await db.Stores.IgnoreQueryFilters().ToListAsync();

        var results = stores.Select(s => new
        {
            s.Id,
            s.Name,
            s.Address,
            s.City,
            s.Phone,
            s.Latitude,
            s.Longitude,
            DistanceKm = (lat.HasValue && lng.HasValue && s.Latitude.HasValue && s.Longitude.HasValue)
                ? (double?)HaversineKm(lat.Value, lng.Value, s.Latitude.Value, s.Longitude.Value)
                : null
        });

        // With a real location, closest first. Without one (permission denied / manual
        // browsing), fall back to alphabetical so the list is still stable and useful.
        results = (lat.HasValue && lng.HasValue)
            ? results.OrderBy(r => r.DistanceKm ?? double.MaxValue)
            : results.OrderBy(r => r.Name);

        return Ok(results.Take(20));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var store = await db.Stores.IgnoreQueryFilters()
            .Where(s => s.Id == id)
            .Select(s => new { s.Id, s.Name, s.Address, s.City, s.Phone })
            .FirstOrDefaultAsync();
        return store is null ? NotFound() : Ok(store);
    }

    [HttpGet("{id}/items")]
    public async Task<IActionResult> GetItems(int id)
    {
        var items = await db.Items.IgnoreQueryFilters()
            .Where(i => i.StoreId == id)
            .OrderBy(i => i.Name)
            .Select(i => new { i.Id, i.Name, i.Unit, i.SellingPrice, i.Quantity })
            .ToListAsync();
        return Ok(items);
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth radius in km
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
