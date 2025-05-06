using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления отзывами
    /// </summary>
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса ReviewService
        /// </summary>
        /// <param name="reviewRepo">Репозиторий отзывов</param>
        public ReviewService(IReviewRepository reviewRepo)
        {
            _reviewRepo = reviewRepo;
        }

        /// <summary>
        /// Создает новый отзыв
        /// </summary>
        /// <param name="review">Данные отзыва</param>
        /// <returns>Созданный отзыв</returns>
        public async Task<Review> CreateAsync(Review review)
        {
            review.Date = DateTime.UtcNow;
            await _reviewRepo.AddAsync(review);
            await _reviewRepo.SaveChangesAsync();
            return review;
        }

        /// <summary>
        /// Получает отзывы по конкретному жилью
        /// </summary>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <returns>Список отзывов</returns>
        public async Task<IEnumerable<Review>> GetByLodgingAsync(int lodgingId)
        {
            var all = await _reviewRepo.GetAllAsync();
            return all.Where(r => r.LodgingId == lodgingId);
        }
    }
}
