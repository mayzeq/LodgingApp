using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class CreateBookingRequest
{
    [Required]
    public int GuestId { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required]
    public DateOnly CheckInDate { get; set; }

    [Required]
    public DateOnly CheckOutDate { get; set; }
}
