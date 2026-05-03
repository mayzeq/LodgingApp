namespace Hotel.Domain.Entities;

public class Order
{
    public int OrderId { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "created";

    public User? User { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public Payment? Payment { get; set; }
}
