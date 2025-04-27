using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; }
        [Required, MinLength(6)]
        public string Password { get; set; }
        [Required, EmailAddress]
        public string Email { get; set; }
        [Phone]
        public string PhoneNumber { get; set; }
    }
}
