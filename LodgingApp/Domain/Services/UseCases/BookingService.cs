using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления бронированиями жилья
    /// </summary>
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepo;
        private readonly ILodgingRepository _lodgingRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса BookingService
        /// </summary>
        /// <param name="bookingRepo">Репозиторий бронирований</param>
        /// <param name="lodgingRepo">Репозиторий жилья</param>
        public BookingService(IBookingRepository bookingRepo, ILodgingRepository lodgingRepo)
        {
            _bookingRepo = bookingRepo;
            _lodgingRepo = lodgingRepo;
        }

        /// <summary>
        /// Создает новое бронирование
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <param name="start">Дата заезда</param>
        /// <param name="end">Дата выезда</param>
        /// <returns>Созданное бронирование</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается, если жилье недоступно или даты некорректны</exception>
        public async Task<Booking> CreateAsync(int userId, int lodgingId, DateTime start, DateTime end)
        {
            var lodging = await _lodgingRepo.GetByIdAsync(lodgingId);
            if (lodging == null || lodging.Status != LodgingStatus.Доступно)
                throw new InvalidOperationException("Жилье недоступно");

            var days = (end - start).Days;
            if (days <= 0) throw new InvalidOperationException("Неверные даты");

            var booking = new Booking
            {
                UserId = userId,
                LodgingId = lodgingId,
                StartDate = start,
                EndDate = end,
                TotalPrice = lodging.Price * days,
                Status = BookingStatus.Ожидание
            };

            await _bookingRepo.AddAsync(booking);
            lodging.Status = LodgingStatus.Забронировано;
            _lodgingRepo.Update(lodging);

            await _bookingRepo.SaveChangesAsync();
            return booking;
        }

        /// <summary>
        /// Подтверждает бронирование
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        /// <exception cref="InvalidOperationException">Выбрасывается, если бронирование не найдено</exception>
        public async Task ConfirmAsync(int bookingId)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            if (booking == null) throw new InvalidOperationException("Не найдено");
            booking.Status = BookingStatus.Подтверждено;
            _bookingRepo.Update(booking);
            await _bookingRepo.SaveChangesAsync();
        }

        /// <summary>
        /// Отменяет бронирование
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        /// <exception cref="InvalidOperationException">Выбрасывается, если бронирование не найдено</exception>
        public async Task CancelAsync(int bookingId)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            if (booking == null) throw new InvalidOperationException("Не найдено");
            booking.Status = BookingStatus.Отменено;
            _bookingRepo.Update(booking);
            var lodging = await _lodgingRepo.GetByIdAsync(booking.LodgingId);
            lodging.Status = LodgingStatus.Доступно;
            _lodgingRepo.Update(lodging);
            await _bookingRepo.SaveChangesAsync();
        }
    }
}