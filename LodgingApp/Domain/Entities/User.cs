using System.Text.Json.Serialization;
using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Entities
{
    /// <summary>
    /// Представляет пользователя системы.
    /// </summary>
    public class User
    {
        /// <summary>
        /// Уникальный идентификатор пользователя.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Имя пользователя (логин).
        /// </summary>
        public required string Username { get; set; }

        /// <summary>
        /// Хэш пароля.
        /// </summary>
        public required string Password { get; set; }

        /// <summary>
        /// Электронная почта пользователя.
        /// </summary>
        public required string Email { get; set; }

        /// <summary>
        /// Номер телефона пользователя (необязательное поле).
        /// </summary>
        public string? PhoneNumber { get; set; }

        public List<Booking>? Bookings { get; set; }
        [JsonIgnore]
        public List<Review>? Reviews { get; set; }
        [JsonIgnore]
        public List<Payment>? Payments { get; set; }
        [JsonIgnore]
        public Admin? Admin { get; set; }
    }
}
