using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KiryanaStore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController(ISaleService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await service.GetAllAsync());

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() => Ok(await service.GetDashboardAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSaleDto dto)
    {
        try
        {
            var created = await service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
