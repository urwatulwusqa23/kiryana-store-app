namespace KiryanaStore.Domain.Entities;

public enum OrderStatus { None, Pending, Confirmed, PickedUp, OnTheWay, Delivered }

public class Sale
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Profit => TotalRevenue - TotalCost;
    public string CustomerName { get; set; } = "Walk-in";
    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();

    // Delivery / order-workflow fields. Walk-in POS sales keep OrderStatus = None.
    public OrderStatus OrderStatus { get; set; } = OrderStatus.None;
    public string? DeliveryAddress { get; set; }
    // Client-generated id that lets the (login-less) Customer Portal find "my orders" again.
    public string? CustomerRef { get; set; }
    public int? RiderId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? OnTheWayAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}
