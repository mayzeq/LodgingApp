using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
using LodgingApp.Domain.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления платежами
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepo;
        private readonly IBookingRepository _bookingRepo;
        private readonly IUserRepository _userRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса PaymentService
        /// </summary>
        /// <param name="paymentRepo">Репозиторий платежей</param>
        /// <param name="bookingRepo">Репозиторий бронирований</param>
        public PaymentService(IPaymentRepository paymentRepo, IBookingRepository bookingRepo, IUserRepository userRepo)
        {
            _paymentRepo = paymentRepo;
            _bookingRepo = bookingRepo;
            _userRepo = userRepo;
        }

        /// <summary>
        /// Создает новый платеж
        /// </summary>
        /// <param name="payment">Данные платежа</param>
        /// <returns>Созданный платеж</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается, если бронирование не найдено</exception>
        public async Task<Payment> CreateAsync(int userId, int bookingId, decimal amount)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId) ?? throw new InvalidOperationException("Бронирование не найдено");
            if (booking.Status == BookingStatus.Canceled)
                throw new InvalidOperationException("Бронирование отменено");
            if (booking.TotalPrice != amount)
                throw new InvalidOperationException("Сумма оплаты не соответствует стоимости бронирования");

            var user = await _userRepo.GetByIdAsync(userId) ?? throw new Exception("Пользователь не найден");

            var payment = new Payment
            {
                BookingId = bookingId,
                UserId = userId,
                Amount = amount,
                Status = PaymentStatus.Pending,
                Date = DateTime.UtcNow,
                User = user,
                Booking = booking
            };



            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();
            return payment;
        }

        /// <summary>
        /// Подтверждает платеж
        /// </summary>
        /// <param name="paymentId">Идентификатор платежа</param>
        /// <exception cref="InvalidOperationException">Выбрасывается, если платеж не найден</exception>
        public async Task ConfirmAsync(int paymentId)
        {
            var payment = await _paymentRepo.GetByIdAsync(paymentId);
            if (payment == null)
                throw new InvalidOperationException("Платеж не найден");

            payment.Status = PaymentStatus.Succes;
            _paymentRepo.Update(payment);

            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId) ?? throw new InvalidOperationException("Бронирование не найдено");
            booking.Status = BookingStatus.Confirmed;

            // Указание UTC
            if (booking.StartDate.Kind == DateTimeKind.Unspecified)
                booking.StartDate = DateTime.SpecifyKind(booking.StartDate, DateTimeKind.Utc);
            if (booking.EndDate.Kind == DateTimeKind.Unspecified)
                booking.EndDate = DateTime.SpecifyKind(booking.EndDate, DateTimeKind.Utc);

            _bookingRepo.Update(booking);

            await _paymentRepo.SaveChangesAsync();
        }
    }
}