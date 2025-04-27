using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.DTOs
{
    public class CreatePaymentDto
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public int BookingId { get; set; }
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}