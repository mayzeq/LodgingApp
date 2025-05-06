namespace LodgingApp.Domain.Entities
{
    public class Booking
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public int LodgingId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalPrice { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Ожидание;

        public required User User { get; set; }
        public required Lodging Lodging { get; set; }
        public Payment? Payment { get; set; }
    }

    public enum BookingStatus
    {
        Ожидание,
        Подтверждено,
        Отменено
    }
}
