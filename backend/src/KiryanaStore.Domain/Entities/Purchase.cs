namespace KiryanaStore.Domain.Entities;

public class Purchase
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
    public decimal TotalCost { get; set; }
    public string Notes { get; set; } = string.Empty;
    public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
}
