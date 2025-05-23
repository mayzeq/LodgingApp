using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
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
        private readonly IUserRepository _userRepo;
        private readonly IAdminRepository _adminRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса BookingService
        /// </summary>
        /// <param name="bookingRepo">Репозиторий бронирований</param>
        /// <param name="lodgingRepo">Репозиторий жилья</param>
        public BookingService(IBookingRepository bookingRepo, ILodgingRepository lodgingRepo, 
            IUserRepository userRepo, IAdminRepository adminRepo)
        {
            _bookingRepo = bookingRepo;
            _lodgingRepo = lodgingRepo;
            _userRepo = userRepo;
            _adminRepo = adminRepo;
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
            start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
            end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

            var lodging = await _lodgingRepo.GetByIdAsync(lodgingId);
            if (lodging == null || lodging.Status != LodgingStatus.Аvailable)
                throw new InvalidOperationException("Жилье недоступно");

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Пользователь не найден");

            var days = (end - start).Days;
            if (days <= 0) throw new InvalidOperationException("Неверные даты");

            var booking = new Booking
            {
                LodgingId = lodgingId,
                StartDate = start,
                EndDate = end,
                TotalPrice = lodging.Price * days,
                Status = BookingStatus.Pending,
                User = user,
                Lodging = lodging
            };

            await _bookingRepo.AddAsync(booking);
            lodging.Status = LodgingStatus.Booked;
            _lodgingRepo.Update(lodging);

            await _bookingRepo.SaveChangesAsync();
            return booking;
        }

        /// <summary>
        /// Отменяет бронирование
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        /// <exception cref="InvalidOperationException">Выбрасывается, если бронирование не найдено</exception>
        public async Task CancelAsync(int bookingId, int userId)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            if (booking == null)
                throw new InvalidOperationException("Бронирование не найдено");

            // Проверка: отменить может только тот, кто бронировал
            if (booking.UserId != userId)
            {
                // Загружаем жильё
                var lodging = await _lodgingRepo.GetByIdAsync(booking.LodgingId);
                if (lodging == null)
                    throw new InvalidOperationException("Жильё не найдено");

                // Загружаем администратора жилья
                var admin = await _adminRepo.GetByIdAsync(lodging.AdminId);
                if (admin == null || admin.UserId != userId)
                    throw new UnauthorizedAccessException("Недостаточно прав для отмены бронирования");
            }

            // Статус
            booking.Status = BookingStatus.Canceled;
            _bookingRepo.Update(booking);

            // Обновляем статус жилья
            var linkedLodging = await _lodgingRepo.GetByIdAsync(booking.LodgingId);
            if (linkedLodging != null)
            {
                linkedLodging.Status = LodgingStatus.Аvailable;
                _lodgingRepo.Update(linkedLodging);
            }

            // Сохраняем
            await _bookingRepo.SaveChangesAsync();
            await _lodgingRepo.SaveChangesAsync();
        }

        public async Task<IEnumerable<Booking>> GetByUserAsync(int userId)
        {
            var all = await _bookingRepo.GetAllAsync();
            return all.Where(r => r.UserId == userId);


        }

        public async Task<Booking> GetBookingByIdAsync(int bookingId)
        {
            var booking = await _bookingRepo.GetBookingByIdWithDetailsAsync(bookingId);
            if (booking == null)
                throw new Exception("Бронирование не найдено");
            return booking;
        }
    }
}