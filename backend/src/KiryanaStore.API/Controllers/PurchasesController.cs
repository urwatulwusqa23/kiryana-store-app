using KiryanaStore.Application.DTOs;
using KiryanaStore.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KiryanaStore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchasesController(IPurchaseService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("supplier/{supplierId}")]
    public async Task<IActionResult> GetBySupplier(int supplierId) =>
        Ok(await service.GetBySupplierAsync(supplierId));

    [HttpPost]
    public async Task<IActionResult> Create(CreatePurchaseDto dto)
    {
        var created = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
