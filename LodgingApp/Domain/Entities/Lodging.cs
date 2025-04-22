namespace LodgingApp.Domain.Entities
{
    public class Lodging
    {
        public int LodgingId { get; set; }
        public int AdminId { get; set; }
        public string Title { get; set; }
        public decimal Price { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }
        public LodgingStatus Status { get; set; } = LodgingStatus.Доступно;

        public Admin Admin { get; set; }
        public List<Booking> Bookings { get; set; }
        public List<Review> Reviews { get; set; }
    }

    public enum LodgingStatus
    {
        Доступно,
        Забронировано
    }
}
