using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class UpdateUserRequest
{
    [MaxLength(20)]
    public string? Role { get; set; }

    public bool? IsActive { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }
}
