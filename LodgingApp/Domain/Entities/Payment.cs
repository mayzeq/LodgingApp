using System.Text.Json.Serialization;

namespace LodgingApp.Domain.Entities
{
    /// <summary>
    /// Представляет сущность платежа.
    /// </summary>
    public class Payment
    {
        /// <summary>
        /// Идентификатор платежа.
        /// </summary>
        public int PaymentId { get; set; }

        /// <summary>
        /// Идентификатор пользователя, совершившего платеж.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Идентификатор бронирования, за которое произведен платеж.
        /// </summary>
        public int BookingId { get; set; }

        /// <summary>
        /// Сумма платежа.
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// Статус платежа.
        /// </summary>
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        /// <summary>
        /// Дата и время платежа.
        /// </summary>
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Booking? Booking { get; set; }
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum PaymentStatus
    {
        Pending = 0,
        Succes = 1,
        Error = 2
    }
}
