using System.ComponentModel.DataAnnotations;
namespace LodgingApp.Domain.ValueObjects
{
    public class LodgingCreation
    {
        public required string Title { get; set; }
        [Range(0, double.MaxValue)]
        public required decimal Price { get; set; }
        public required string Location { get; set; }
        public required string Description { get; set; }
    }
}