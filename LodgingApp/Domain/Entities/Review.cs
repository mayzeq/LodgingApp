using System.Text.Json.Serialization;

namespace LodgingApp.Domain.Entities
{
    /// <summary>
    /// Представляет отзыв пользователя о жилье.
    /// </summary>
    public class Review
    {
        public int ReviewId { get; set; }
        public int UserId { get; set; }
        public int LodgingId { get; set; }
        /// <summary>
        /// Оценка жилья.
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Комментарий пользователя.
        /// </summary>
        public string? Comment { get; set; }

        /// <summary>
        /// Дата публикации отзыва.
        /// </summary>
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Lodging? Lodging { get; set; }
    }
}
