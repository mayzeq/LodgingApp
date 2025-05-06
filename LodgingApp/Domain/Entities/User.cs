using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Entities
{
    public class User
    {
        public int UserId { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required string Email { get; set; }
        public string? PhoneNumber { get; set; }

        public List<Booking>? Bookings { get; set; }
        public List<Review>? Reviews { get; set; }
        public List<Payment>? Payments { get; set; }
        public Admin? Admin { get; set; }
    }
}
