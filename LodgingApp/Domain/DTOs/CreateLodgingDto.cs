using System.ComponentModel.DataAnnotations;
namespace LodgingApp.Domain.DTOs
{
    public class CreateLodgingDto
    {
        [Required]
        public int AdminId { get; set; }
        [Required]
        public string Title { get; set; }
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
        [Required]
        public string Location { get; set; }
        public string Description { get; set; }
    }
}