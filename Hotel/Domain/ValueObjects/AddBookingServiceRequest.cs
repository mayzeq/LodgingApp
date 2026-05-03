using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class AddBookingServiceRequest
{
    [Required]
    public int BookingId { get; set; }

    [Required]
    public int ServiceId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;
}
