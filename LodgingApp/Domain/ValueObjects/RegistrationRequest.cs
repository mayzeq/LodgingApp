using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class RegistrationRequest
    {
        [Required]
        public required string Username { get; set; }
        [Required, MinLength(6)]
        public required string Password { get; set; }
        [Required, EmailAddress]
        public required string Email { get; set; }
        [Phone]
        public required string PhoneNumber { get; set; }
    }
}
