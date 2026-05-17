using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class ResetPasswordRequest
{
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}
