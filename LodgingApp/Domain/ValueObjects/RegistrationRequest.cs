using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class RegistrationRequest
    {
        public required string Username { get; set; }
        [MinLength(6)]
        public required string Password { get; set; }
        [EmailAddress]
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
    }
}
