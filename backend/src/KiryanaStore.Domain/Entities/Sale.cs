namespace KiryanaStore.Domain.Entities;

public class Sale
{
    public int Id { get; set; }
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Profit => TotalRevenue - TotalCost;
    public string CustomerName { get; set; } = "Walk-in";
    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
}
