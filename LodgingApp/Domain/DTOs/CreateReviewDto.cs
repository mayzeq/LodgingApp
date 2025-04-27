using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public int LodgingId { get; set; }
        [Range(1, 5)]
        public int Rating { get; set; }
        public string Comment { get; set; }
    }
}