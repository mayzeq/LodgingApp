using System.Text.Json.Serialization;

namespace LodgingApp.Domain.Entities

{
    /// <summary>
    /// Представляет сущность бронирования.
    /// </summary>
    public class Booking
    {
        /// <summary>
        /// Идентификатор бронирования.
        /// </summary>
        public int BookingId { get; set; }

        /// <summary>
        /// Идентификатор пользователя, совершившего бронирование.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Идентификатор жилья.
        /// </summary>
        public int LodgingId { get; set; }

        /// <summary>
        /// Дата начала бронирования.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Дата окончания бронирования.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Общая стоимость бронирования.
        /// </summary>
        public decimal TotalPrice { get; set; }

        /// <summary>
        /// Текущий статус бронирования (Ожидание, Подтверждено, Отменено).
        /// </summary>
        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Lodging? Lodging { get; set; }
        public Payment? Payment { get; set; }
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum BookingStatus
    {
        Pending = 0,
        Confirmed = 1,
        Canceled = 2
    }
}
