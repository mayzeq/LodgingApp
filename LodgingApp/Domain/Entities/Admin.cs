namespace LodgingApp.Domain.Entities
{
    public class Admin
    {
        public int AdminId { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; }

        public User User { get; set; }
        public List<Lodging> Lodgings { get; set; }
        public Admin CreatedByAdmin { get; set; }
    }
}