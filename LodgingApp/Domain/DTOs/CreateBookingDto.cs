using System;
using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.DTOs
{
    public class CreateBookingDto
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public int LodgingId { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
    }
}
