namespace Hotel.Domain.Entities;

public class Booking
{
    public int BookingId { get; set; }
    public int GuestId { get; set; }
    public int RoomId { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public DateTime BookingDatetime { get; set; } = DateTime.UtcNow;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = "pending";

    public Guest? Guest { get; set; }
    public Room? Room { get; set; }
    public Payment? Payment { get; set; }
    public ICollection<BookingService> BookingServices { get; set; } = new List<BookingService>();
    public ICollection<BookingGuest> BookingGuests { get; set; } = new List<BookingGuest>();
}
