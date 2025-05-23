using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class LoginRequest
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }
}
