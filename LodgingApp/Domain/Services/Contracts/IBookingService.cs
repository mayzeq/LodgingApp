using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Services.Contracts
{
    /// <summary>
    /// Интерфейс для сервиса управления бронированиями
    /// </summary>
    public interface IBookingService
    {
        /// <summary>
        /// Создает новое бронирование
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <param name="start">Дата заезда</param>
        /// <param name="end">Дата выезда</param>
        /// <returns>Созданное бронирование</returns>
        Task<Booking> CreateAsync(int userId, int lodgingId, DateTime start, DateTime end);

        /// <summary>
        /// Подтверждает бронирование
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        Task ConfirmAsync(int bookingId);

        /// <summary>
        /// Отменяет бронирование
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        Task CancelAsync(int bookingId);
    }
} 