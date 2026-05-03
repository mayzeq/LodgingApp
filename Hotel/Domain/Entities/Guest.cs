namespace Hotel.Domain.Entities;

public class Guest
{
    public int GuestId { get; set; }
    public int UserId { get; set; }
    public string Surname { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? Patronymic { get; set; }
    public DateOnly Birthdate { get; set; }
    public string Passport { get; set; } = string.Empty;

    public User? User { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
