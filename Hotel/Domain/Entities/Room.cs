namespace Hotel.Domain.Entities;

public class Room
{
    public int RoomId { get; set; }
    public int RoomTypeId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public string Status { get; set; } = "available";
    public string? PhotoUrl { get; set; }

    public RoomType? RoomType { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
