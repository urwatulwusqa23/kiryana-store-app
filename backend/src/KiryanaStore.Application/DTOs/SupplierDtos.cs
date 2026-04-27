namespace KiryanaStore.Application.DTOs;

public record SupplierDto(int Id, string Name, string Phone, string Company, DateTime CreatedAt);

public record CreateSupplierDto(string Name, string Phone, string Company);

public record UpdateSupplierDto(string Name, string Phone, string Company);
