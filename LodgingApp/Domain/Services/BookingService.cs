using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;

namespace LodgingApp.Domain.Services
{
    public class BookingService
    {
        private readonly IBookingRepository _bookingRepo;
        private readonly ILodgingRepository _lodgingRepo;

        public BookingService(IBookingRepository bookingRepo, ILodgingRepository lodgingRepo)
        {
            _bookingRepo = bookingRepo;
            _lodgingRepo = lodgingRepo;
        }

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

        public async Task ConfirmAsync(int bookingId)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            if (booking == null) throw new InvalidOperationException("Не найдено");
            booking.Status = BookingStatus.Подтверждено;
            _bookingRepo.Update(booking);
            await _bookingRepo.SaveChangesAsync();
        }

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