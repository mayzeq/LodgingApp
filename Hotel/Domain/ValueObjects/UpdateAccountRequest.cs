using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class UpdateAccountRequest
{
    [EmailAddress]
    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    public string? CurrentPassword { get; set; }

    [MinLength(6)]
    public string? NewPassword { get; set; }
}
