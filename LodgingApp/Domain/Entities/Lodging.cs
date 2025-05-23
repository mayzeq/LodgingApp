using System.Text.Json.Serialization;
using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Entities
{
    /// <summary>
    /// Представляет сущность жилья.
    /// </summary>
    public class Lodging
    {
        /// <summary>
        /// Идентификатор жилья.
        /// </summary>
        public int LodgingId { get; set; }

        /// <summary>
        /// Идентификатор администратора.
        /// </summary>
        public int AdminId { get; set; }

        /// <summary>
        /// Название жилья.
        /// </summary>
        public required string Title { get; set; }

        /// <summary>
        /// Цена за сутки.
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Расположение жилья.
        /// </summary>
        public required string Location { get; set; }

        /// <summary>
        /// Описание жилья.
        /// </summary>
        public required string Description { get; set; }

        /// <summary>
        /// Статус жилья (например, доступно, забронировано).
        /// </summary>
        public LodgingStatus Status { get; set; } = LodgingStatus.Аvailable;

        [JsonIgnore]
        public Admin? Admin { get; set; }
        public List<Booking>? Bookings { get; set; }
        public List<Review>? Reviews { get; set; }
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum LodgingStatus
    {
        Аvailable = 0,
        Booked = 1,
    }
}
