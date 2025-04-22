namespace LodgingApp.Domain.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int UserId { get; set; }
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Ожидание;
        public DateTime Date { get; set; } = DateTime.UtcNow;

        public User User { get; set; }
        public Booking Booking { get; set; }
    }

    public enum PaymentStatus
    {
        Ожидание,
        Успешно,
        Ошибка
    }
}
