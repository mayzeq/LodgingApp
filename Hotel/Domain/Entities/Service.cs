namespace Hotel.Domain.Entities;

public class Service
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsIncluded { get; set; }

    public ICollection<BookingService> BookingServices { get; set; } = new List<BookingService>();
}
