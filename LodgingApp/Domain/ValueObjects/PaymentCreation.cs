using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class PaymentCreation
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public int BookingId { get; set; }
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}