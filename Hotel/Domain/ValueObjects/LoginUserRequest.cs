using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class LoginUserRequest
{
    [Required]
    public string Login { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
