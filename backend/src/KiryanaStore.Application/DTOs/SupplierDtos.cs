using System.ComponentModel.DataAnnotations;

namespace KiryanaStore.Application.DTOs;

public record SupplierDto(int Id, string Name, string Phone, string Company, DateTime CreatedAt);

public record CreateSupplierDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Phone, StringLength(20)] string Phone,
    [property: StringLength(200)] string Company);

public record UpdateSupplierDto(
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: Phone, StringLength(20)] string Phone,
    [property: StringLength(200)] string Company);
