using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class RegisterUserRequest
{
    [Required]
    [MaxLength(50)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string Role { get; set; } = "guest";
}
