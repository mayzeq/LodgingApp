using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class PaymentCreation
    {
        public required int BookingId { get; set; }
        [Range(0.01, double.MaxValue)]
        public required decimal Amount { get; set; }
    }
}