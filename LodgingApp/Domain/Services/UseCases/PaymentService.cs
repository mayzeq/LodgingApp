using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления платежами
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepo;
        private readonly IBookingRepository _bookingRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса PaymentService
        /// </summary>
        /// <param name="paymentRepo">Репозиторий платежей</param>
        /// <param name="bookingRepo">Репозиторий бронирований</param>
        public PaymentService(IPaymentRepository paymentRepo, IBookingRepository bookingRepo)
        {
            _paymentRepo = paymentRepo;
            _bookingRepo = bookingRepo;
        }

        /// <summary>
        /// Создает новый платеж
        /// </summary>
        /// <param name="payment">Данные платежа</param>
        /// <returns>Созданный платеж</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается, если бронирование не найдено</exception>
        public async Task<Payment> CreateAsync(Payment payment)
        {
            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId);
            if (booking == null) throw new InvalidOperationException("Бронирование не найдено");

            payment.Date = DateTime.UtcNow;
            payment.Status = PaymentStatus.Ожидание;
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
            if (payment == null) throw new InvalidOperationException("Платеж не найден");

            payment.Status = PaymentStatus.Успешно;
            _paymentRepo.Update(payment);

            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId);
            booking.Status = BookingStatus.Подтверждено;
            _bookingRepo.Update(booking);

            await _paymentRepo.SaveChangesAsync();
        }
    }
}