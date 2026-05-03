namespace Hotel.Domain.Entities;

public class User
{
    public int UserId { get; set; }
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "guest";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
