namespace KiryanaStore.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
