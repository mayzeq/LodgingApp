namespace Hotel.Domain.Entities;

public class BookingGuest
{
    public int BookingGuestId { get; set; }
    public int BookingId { get; set; }
    public int GuestId { get; set; }
    public bool IsPrimary { get; set; } = false;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Booking? Booking { get; set; }
    public Guest? Guest { get; set; }
}

