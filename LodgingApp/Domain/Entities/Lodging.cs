using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Entities
{
    public class Lodging
    {
        public int LodgingId { get; set; }
        public int AdminId { get; set; }
        public required string Title { get; set; }
        public decimal Price { get; set; }
        public required string Location { get; set; }
        public required string Description { get; set; }
        public LodgingStatus Status { get; set; } = LodgingStatus.Доступно;

        public required Admin Admin { get; set; }
        public List<Booking>? Bookings { get; set; }
        public List<Review>? Reviews { get; set; }
    }

    public enum LodgingStatus
    {
        Доступно = 0,
        Забронировано = 1,
    }
}
