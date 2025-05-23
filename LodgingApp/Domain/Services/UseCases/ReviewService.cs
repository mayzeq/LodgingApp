using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
using LodgingApp.Domain.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления отзывами
    /// </summary>
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IUserRepository _userRepo;
        private readonly IBookingRepository _bookingRepo;
        private readonly ILodgingRepository _lodgingRepo;

        /// <summary>
        /// Инициализирует новый экземпляр класса ReviewService
        /// </summary>
        /// <param name="reviewRepo">Репозиторий отзывов</param>
        public ReviewService(IReviewRepository reviewRepo, IUserRepository userRepo,
            IBookingRepository bookingRepo, ILodgingRepository lodgingRepo)
        {
            _reviewRepo = reviewRepo;
            _userRepo = userRepo;
            _bookingRepo = bookingRepo;
            _lodgingRepo = lodgingRepo;
        }

        /// <summary>
        /// Создает новый отзыв
        /// </summary>
        /// <param name="review">Данные отзыва</param>
        /// <returns>Созданный отзыв</returns>
        public async Task<Review> CreateAsync(int userId, int lodgingId, int rating, string comment)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Пользователь не найден");

            var lodging = await _lodgingRepo.GetByIdAsync(lodgingId);
            if (lodging == null)
                throw new Exception("Жильё не найдено");

            var review = new Review
            {
                UserId = userId,
                LodgingId = lodgingId,
                Rating = rating,
                Comment = comment,
                Date = DateTime.UtcNow,
                User = user,
                Lodging = lodging
            };

            var hadBooking = await _bookingRepo.GetAllAsync();
            if (!hadBooking.Any(b => b.UserId == userId && b.LodgingId == review.LodgingId && b.Status == BookingStatus.Confirmed))
                throw new InvalidOperationException("Нельзя оставить отзыв без завершённого бронирования");

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
