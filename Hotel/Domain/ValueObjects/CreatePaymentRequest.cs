using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class CreatePaymentRequest
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "card";
}
