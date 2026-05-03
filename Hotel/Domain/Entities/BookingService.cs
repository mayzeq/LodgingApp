namespace Hotel.Domain.Entities;

public class BookingService
{
    public int BookingServiceId { get; set; }
    public int BookingId { get; set; }
    public int ServiceId { get; set; }
    public int Quantity { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Booking? Booking { get; set; }
    public Service? Service { get; set; }
}
