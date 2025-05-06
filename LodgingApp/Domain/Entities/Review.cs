namespace LodgingApp.Domain.Entities
{
    public class Review
    {
        public int ReviewId { get; set; }
        public int UserId { get; set; }
        public int LodgingId { get; set; }
        public int Rating { get; set; } 
        public string? Comment { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;

        public required User User { get; set; }
        public required Lodging Lodging { get; set; }
    }
}
