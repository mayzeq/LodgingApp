using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class CreateBookingRequest
{
    [Required]
    public int GuestId { get; set; }

    // Optional: allow booking for multiple guests.
    // If provided, the first guest becomes primary (also duplicated into GuestId for backward compatibility).
    public List<int>? GuestIds { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required]
    public DateOnly CheckInDate { get; set; }

    [Required]
    public DateOnly CheckOutDate { get; set; }
}
