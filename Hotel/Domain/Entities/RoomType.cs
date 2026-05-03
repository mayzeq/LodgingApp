namespace Hotel.Domain.Entities;

public class RoomType
{
    public int RoomTypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MaxGuests { get; set; }
    public decimal PricePerNight { get; set; }

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
