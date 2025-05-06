using System.ComponentModel.DataAnnotations;
namespace LodgingApp.Domain.ValueObjects
{
    public class LodgingCreation
    {
        [Required]
        public int AdminId { get; set; }
        [Required]
        public required string Title { get; set; }
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
        [Required]
        public required string Location { get; set; }
        public required string Description { get; set; }
    }
}