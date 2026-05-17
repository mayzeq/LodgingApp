using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class CreatePaymentRequest
{
    [Required]
    public int BookingId { get; set; }

    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "card";
}
