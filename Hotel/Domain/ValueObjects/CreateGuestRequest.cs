using System.ComponentModel.DataAnnotations;

namespace Hotel.Domain.ValueObjects;

public class CreateGuestRequest
{
    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Surname { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Patronymic { get; set; }

    [Required]
    public DateOnly Birthdate { get; set; }

    [Required]
    [MaxLength(11)]
    [MinLength(11)]
    [RegularExpression(@"^\d{4}\s\d{6}$", ErrorMessage = "Паспорт должен быть в формате: 1234 567890")]
    public string Passport { get; set; } = string.Empty;
}
