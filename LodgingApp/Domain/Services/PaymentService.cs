using System;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;

namespace LodgingApp.Domain.Services
{
    public class PaymentService
    {
        private readonly IPaymentRepository _paymentRepo;
        private readonly IBookingRepository _bookingRepo;

        public PaymentService(IPaymentRepository paymentRepo, IBookingRepository bookingRepo)
        {
            _paymentRepo = paymentRepo;
            _bookingRepo = bookingRepo;
        }

        public async Task<Payment> CreateAsync(Payment payment)
        {
            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId);
            if (booking == null || booking.Status != BookingStatus.Ожидание)
                throw new InvalidOperationException("Бронирование недействительно для оплаты.");

            payment.Status = PaymentStatus.Ожидание;
            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();
            return payment;
        }

        public async Task ConfirmAsync(int paymentId)
        {
            var payment = await _paymentRepo.GetByIdAsync(paymentId);
            if (payment == null) throw new InvalidOperationException("Оплата не найдена.");
            payment.Status = PaymentStatus.Успешно;
            _paymentRepo.Update(payment);

            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId);
            booking.Status = BookingStatus.Подтверждено;
            _bookingRepo.Update(booking);

            await _paymentRepo.SaveChangesAsync();
        }
    }
}