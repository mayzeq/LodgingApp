using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Services.Contracts
{
    /// <summary>
    /// Интерфейс для сервиса управления платежами
    /// </summary>
    public interface IPaymentService
    {
        /// <summary>
        /// Создает новый платеж
        /// </summary>
        /// <param name="payment">Данные платежа</param>
        /// <returns>Созданный платеж</returns>
        Task<Payment> CreateAsync(Payment payment);

        /// <summary>
        /// Подтверждает платеж
        /// </summary>
        /// <param name="paymentId">Идентификатор платежа</param>
        Task ConfirmAsync(int paymentId);
    }
} 