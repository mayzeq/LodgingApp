using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Services.Contracts
{
    /// <summary>
    /// Интерфейс для сервиса управления отзывами
    /// </summary>
    public interface IReviewService
    {
        /// <summary>
        /// Создает новый отзыв
        /// </summary>
        /// <param name="review">Данные отзыва</param>
        /// <returns>Созданный отзыв</returns>
        Task<Review> CreateAsync(Review review);

        /// <summary>
        /// Получает отзывы по конкретному жилью
        /// </summary>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <returns>Список отзывов</returns>
        Task<IEnumerable<Review>> GetByLodgingAsync(int lodgingId);
    }
} 